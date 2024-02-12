from functools import reduce
import urllib.request
import ujson
import shapely
import h3
import math
import string
import copy
import geopandas
import pandas

from turfpy.measurement import area as turf_area
from turfpy.measurement import bbox as turf_bbox
from turfpy.transformation import intersect as turf_intersect
from geojson import Feature, FeatureCollection

MMIN = 5
MMAX = 7

SCENS = [
    "bl_h000",
    "CS3_ALT3_2022med_L2020ADV",
    "LTO_BA_EXP1_2022MED",
]

DU_AREA_MULT = 1 / 6e8
GW_AREA_MULT = 1 / 6e7

def avg_1D(arr): 
    if len(arr) == 0:
        return 0
    return reduce(lambda a, b: a + b, arr) / len(arr) 

def avg_2D(arr):
    
    avg_arr = []

    if len(arr) != 0:
        for j in range(0, len(arr[0])):
            # round to truncate numbers in final data file
            avg_arr.append(int(round(avg_1D([a[j] for a in arr]))))


def weighted_avg_1D(arr, weights):
    return sum([a * w for a, w in zip(arr, weights)])

def weighted_avg_2D(arr, weights):
    
    avg_arr = []

    if len(arr) != 0:
        for j in range(0, len(arr[0])):
            # round to truncate numbers in final data file
            avg_arr.append(int(round(weighted_avg_1D([a[j] for a in arr], weights))))

    return avg_arr

def weighted_mode(arr, weights):
    keeptrack = {}
    for a, w in zip(arr, weights):
        if a not in keeptrack:
            keeptrack[a] = 0
        keeptrack[a] += w
    
    sorteds = [k for k, _ in sorted(keeptrack.items(), key=lambda item: item[1], reverse=True)]
    return sorteds

def id_to_val(id_str):
    last_part = id_str.rstrip(string.digits)[-2:]
    if last_part == "SA" or last_part == "SU":
        return 0
    if last_part == "XA":
        return 1
    if last_part == "PA" or last_part == "PU" or last_part == "PR":
        return 2
    if last_part == "NA" or last_part == "NU" or last_part == "NR":
        return 3
    assert False, f"Unknown id: {id_str}"

# version of h3.polygonToCells that includes all hexagons covering polygon, not just hexagons with its centroid in the polygon
def polygon_to_cells(geometry, res):
    bbox = turf_bbox(geometry)
    center_lon = bbox[0] + (bbox[2] - bbox[0]) / 2
    center_lat = bbox[1] + (bbox[3] - bbox[1]) / 2
    center = h3.geo_to_h3(center_lat, center_lon, res)
    radius = h3.h3_distance(center, h3.geo_to_h3(bbox[1], bbox[0], res))
    hexes = h3.k_ring(center, radius)

    cells = []

    for hx in hexes:
        hxfeat = {
                "type": "MultiPolygon",
                "coordinates": [ [ [ [lon, lat] for lat, lon in b ] for b in a ] for a in h3.h3_set_to_multi_polygon([hx]) ]
            }
        intsection = turf_intersect([hxfeat, geometry])
        if intsection:
            cells.append(hx)

    return cells

def find_in(arr, cond):
    return next(elem for elem in arr if cond(elem))

# https://gis.stackexchange.com/a/281676
def get_neighbors(feats):    
    gdf = geopandas.GeoDataFrame.from_features(feats)

    gdf["NEIGHBORS"] = None  

    for index, region in gdf.iterrows():   

        # get 'not disjoint' countries
        neighbors = gdf[~gdf.geometry.disjoint(region.geometry)].DU_ID.tolist()

        # remove own duid of the region from the list
        neighbors = [ duid for duid in neighbors if region.DU_ID != duid ]

        # add duids of neighbors as NEIGHBORS value
        gdf.at[index, "NEIGHBORS"] = ",".join(neighbors)

    neighbor_map = gdf[['DU_ID', 'NEIGHBORS']]

    neighbor_map = pandas.Series(neighbor_map.NEIGHBORS.values,index=neighbor_map.DU_ID).to_dict()

    for duid in neighbor_map:
        neighbor_map[duid] = neighbor_map[duid].split(',')

    return neighbor_map

def get_moran_i_1D(rgs, neighbors, weights):
    # get mean
    mean = weighted_avg_1D(rgs, weights)
    # get variance
    variance = sum([(x - mean) ** 2 for x in rgs])
    W = sum([len(ns) for ns in neighbors])

    # if there is no variance or there are no neighbors, assume perfect clustering
    if variance == 0 or W == 0:
        return 1
    
    # init sigma
    sigma = 0
    # loop through regions in hex
    for rg_i, neighbor_rgs in zip(rgs, neighbors):
    #     for each neighbor
        for rg_j_key in neighbor_rgs:
            rg_j = rgs[rg_j_key]
    #     - first check if it's in hex
    #     - if it is, sigma += (x_i - mean) * (x_j - mean)
            sigma += (rg_i - mean) * (rg_j - mean)
    # * N / W / variance
    N = len(rgs)

    # print("==================")
    # # print(rgs)
    # print(mean)
    # print(variance)
    # print(sigma)
    # print(N)
    # print(W)

    mi = sigma * N / W / variance


    return mi


def get_moran_i_2D(rgs, neighbors, weights):    
    mi_arr = []

    if len(rgs) != 0:
        for j in range(0, len(rgs[0])):
            # round to truncate numbers in final data file
            mi_arr.append(int(round(get_moran_i_1D([a[j] for a in rgs], neighbors, weights) * 100)))

    return mi_arr


# Load files (region and temporal)

def correct_demand_data(demand_datas):
    for duid in demand_datas:
        # turn map of values to a plain array, remove first element as it is trash
        demand_datas[duid] = list(demand_datas[duid].values())[1:]

        # sometimes data is screwed up
        if demand_datas[duid][0] is None:
            demand_datas[duid] = [0] * len(demand_datas[duid])

    return demand_datas

def correct_gw_data(gw_geojson):
    # turn map of values to a plain array, remove first and last element as it is trash, turn str to int
    for feat in gw_geojson["features"]:
        feat["properties"]["Groundwater"] = [float(elem) for elem in list(feat["properties"]["Groundwater"].values())[1:-1] ]

    return gw_geojson

demand_regions = ujson.load(urllib.request.urlopen("http://infovis.cs.ucdavis.edu/geospatial/api/shapes/demand_units"))
bl_unmet_demands = correct_demand_data(ujson.load(urllib.request.urlopen("http://infovis.cs.ucdavis.edu/geospatial/api/data/scenario/CS3_BL/unmetdemand")))
bl_demands = correct_demand_data(ujson.load(urllib.request.urlopen("http://infovis.cs.ucdavis.edu/geospatial/api/data/scenario/CS3_BL/demand")))

scen_unmet_demands = {}
scen_demands = {}

for scen in SCENS:
    scen_unmet_demands[scen] = correct_demand_data(ujson.load(urllib.request.urlopen(f"http://infovis.cs.ucdavis.edu/geospatial/api/data/scenario/{scen}/unmetdemand")))
    scen_demands[scen] = correct_demand_data(ujson.load(urllib.request.urlopen(f"http://infovis.cs.ucdavis.edu/geospatial/api/data/scenario/{scen}/demand")))

gw_regions = correct_gw_data(ujson.load(open("baseline_groundwater.json")))


# Convert polygons to multipolygons and attach temporal data

feats = demand_regions["features"]
demand_regions_by_id = {}

for feat in feats:
    duid = feat["properties"]["DU_ID"]
    
    # duid can be null for some reason
    if not duid:
        continue

    # skip duid is not found in all datasets
    if duid not in bl_unmet_demands or \
        duid not in bl_demands or \
        any(duid not in scen_unmet_demands[scen] for scen in SCENS) or \
        any(duid not in scen_demands[scen] for scen in SCENS):
        continue

    if duid not in demand_regions_by_id:

        demand_regions_by_id[duid] = copy.deepcopy(feat)
        demand_regions_by_id[duid]["geometry"]["type"] = "MultiPolygon"
        demand_regions_by_id[duid]["geometry"]["coordinates"] = []

        newprops = copy.deepcopy(feat["properties"])
        newprops["LandUse"] = id_to_val(duid)
        newprops["UnmetDemandBaseline"] = bl_unmet_demands[duid]
        newprops["DemandBaseline"] = bl_demands[duid]

        newprops["UnmetDemand"] = {}
        newprops["Demand"] = {}

        for scen in SCENS:
            newprops["UnmetDemand"][scen] = scen_unmet_demands[scen][duid]
            newprops["Demand"][scen] = scen_demands[scen][duid]

        demand_regions_by_id[duid]["properties"] = newprops
    
    demand_regions_by_id[duid]["geometry"]["coordinates"].append(feat["geometry"]["coordinates"])

demand_regions["features"] = list(demand_regions_by_id.values())

neighbor_map = get_neighbors(demand_regions["features"])

# Normalize datas to area

for region in demand_regions["features"]:
    area = turf_area(FeatureCollection([region])) * DU_AREA_MULT

    props = region["properties"]

    props["UnmetDemandBaseline"] = [ elem / area for elem in region["properties"]["UnmetDemandBaseline"] ]
    props["DemandBaseline"] = [ elem / area for elem in region["properties"]["DemandBaseline"] ]

    for scen in SCENS:
        props["UnmetDemand"][scen] = [ elem / area for elem in region["properties"]["UnmetDemand"][scen] ]
        props["Demand"][scen] = [ elem / area for elem in region["properties"]["Demand"][scen] ]

    # # save area because why not
    # props["Area"] = area

for region in gw_regions["features"]:
    area = turf_area(FeatureCollection([region])) * GW_AREA_MULT

    region["properties"]["Groundwater"] = [ elem / area for elem in region["properties"]["Groundwater"] ]

    # # save area because why not
    # region["properties"]["Area"] = area

# For each reses:
#   Convert multipolygons to hexes (map of hexes -> array of DU_IDs and array of groundwaters)
#   Aggregate info and scale to hex/(total region occupied by georegions) intersection, also attach info on arrays of DU_IDS and groundwaters

final_hex_json = {}

for res in range(MMIN, MMAX + 1):
    hex_to_props = {}
    hex_to_regions = {}

    for region in demand_regions["features"]:
        duid = region["properties"]["DU_ID"]
        geom = region["geometry"]

        for cell in polygon_to_cells(geom, res):
            if cell not in hex_to_regions:
                hex_to_regions[cell] = {
                    "demand_rgs": [],
                    "gw_rgs": []
                }
            
            hex_to_regions[cell]["demand_rgs"].append(duid)

            
    for region in gw_regions["features"]:
        elem_id = region["properties"]["elem_id"]
        geom = region["geometry"]
        
        for cell in polygon_to_cells(geom, res):
            if cell not in hex_to_regions:
                hex_to_regions[cell] = {
                    "demand_rgs": [],
                    "gw_rgs": []
                }
            
            hex_to_regions[cell]["gw_rgs"].append(elem_id)

    for hx in hex_to_regions:
        demand_rgs = hex_to_regions[hx]["demand_rgs"]
        gw_rgs = hex_to_regions[hx]["gw_rgs"]


        # make sure we have both demand and groundwater information in this hex
        if not (gw_rgs and demand_rgs):
            continue
        
        hxfeat = {
                "type": "MultiPolygon",
                "coordinates": [ [ [ [lon, lat] for lat, lon in b ] for b in a ] for a in h3.h3_set_to_multi_polygon([hx]) ]
            }

        intersect_factors = []
        total_occupied_space = sum([turf_area(FeatureCollection([turf_intersect([hxfeat, demand_regions_by_id[rg]["geometry"]])])) for rg in demand_rgs]) * DU_AREA_MULT

        for rg in demand_rgs:
            intersect_factors.append((turf_area(FeatureCollection([turf_intersect([hxfeat, demand_regions_by_id[rg]["geometry"]])])) * DU_AREA_MULT) / total_occupied_space)

        newprops = {}

        def find_props_ordered(prop_name):
            prop_arr = []
            for rg in demand_rgs:
                reg_feat = find_in(demand_regions["features"], lambda e: e["properties"]["DU_ID"] == rg)
                prop_arr.append(reg_feat["properties"][prop_name])
            return prop_arr

        def weight_by_prop(prop_name):
            prop_arr = []
            for rg in demand_rgs:
                reg_feat = find_in(demand_regions["features"], lambda e: e["properties"]["DU_ID"] == rg)
                prop_arr.append(reg_feat["properties"][prop_name])
            return weighted_avg_2D(prop_arr, intersect_factors)


        newprops["UnmetDemandBaseline"] = weighted_avg_2D(find_props_ordered("UnmetDemandBaseline"), intersect_factors)
        newprops["DemandBaseline"] = weighted_avg_2D(find_props_ordered("DemandBaseline"), intersect_factors)
        
        newprops["UnmetDemandBaselineAverage"] = avg_1D(newprops["UnmetDemandBaseline"])
        newprops["DemandBaselineAverage"] = avg_1D(newprops["DemandBaseline"])
        
        ud_arr = find_props_ordered("UnmetDemandBaseline")
        neighbor_arr = [
            [demand_rgs.index(n) for n in neighbor_map[rg] if n in demand_rgs] for rg in demand_rgs
        ]

        newprops["MUnmetDemandBaseline"] = get_moran_i_2D(ud_arr, neighbor_arr, intersect_factors)

        newprops["LandUse"] = weighted_mode(find_props_ordered("LandUse"), intersect_factors)

        newprops["UnmetDemand"] = {}
        newprops["Demand"] = {}
        newprops["UnmetDemandAverage"] = {}
        newprops["DemandAverage"] = {}

        
        def weight_by_prop_scen(prop_name, scen):
            prop_arr = []
            for rg in demand_rgs:
                reg_feat = find_in(demand_regions["features"], lambda e: e["properties"]["DU_ID"] == rg)
                prop_arr.append(reg_feat["properties"][prop_name][scen])
            return weighted_avg_2D(prop_arr, intersect_factors)


        for scen in SCENS:
            newprops["UnmetDemand"][scen] = weight_by_prop_scen("UnmetDemand", scen)
            newprops["Demand"][scen] = weight_by_prop_scen("Demand", scen)
            
            newprops["UnmetDemandAverage"][scen] = avg_1D(newprops["UnmetDemand"][scen])
            newprops["DemandAverage"][scen] = avg_1D(newprops["Demand"][scen])


        
        intersect_factors = []
        total_occupied_space = sum([turf_area(FeatureCollection([turf_intersect([hxfeat, find_in(gw_regions["features"], lambda e: e["properties"]["elem_id"] == rg)["geometry"]])])) for rg in gw_rgs]) * GW_AREA_MULT

        for rg in gw_rgs:
            intersect_factors.append((turf_area(FeatureCollection([turf_intersect([hxfeat, find_in(gw_regions["features"], lambda e: e["properties"]["elem_id"] == rg)["geometry"]])])) * GW_AREA_MULT) / total_occupied_space)
            
        def weight_by_prop(prop_name):
            prop_arr = []
            for rg in gw_rgs:
                reg_feat = find_in(gw_regions["features"], lambda e: e["properties"]["elem_id"] == rg)
                prop_arr.append(reg_feat["properties"][prop_name])
            return weighted_avg_2D(prop_arr, intersect_factors)

        newprops["Groundwater"] = weight_by_prop("Groundwater")
        newprops["GroundwaterAverage"] = avg_1D(newprops["Groundwater"])

        hex_to_props[hx] = newprops

    final_hex_json[str(res)] = hex_to_props


# Write JSON

with open(f"hex_{MMIN}_{MMAX}.json", "w") as outfile:
    ujson.dump(final_hex_json, outfile)

with open(f"demand_geo.json", "w") as outfile:
    ujson.dump(demand_regions, outfile)

with open(f"groundwater_geo.json", "w") as outfile:
    ujson.dump(gw_regions, outfile)