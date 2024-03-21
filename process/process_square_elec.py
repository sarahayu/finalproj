from functools import reduce
import urllib.request
import ujson
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

def binCoord(lat, lon, deg):
    return math.floor(lat / deg) * deg, math.floor(lon / deg) * deg

def kmToLatDeg(dist):
    return dist / 111.1

def hexSideToSquareSide(res):
    return h3.edge_length(res, 'km') * 2

def resToDegSide(res):
    return kmToLatDeg(hexSideToSquareSide(res))

# https://stackoverflow.com/a/8595991
def truncStr(num):
    return '%.3f'%(num)

def geo_to_h3(lat, lon, res):
    kmSqSide = hexSideToSquareSide(res)
    latSqSide = kmToLatDeg(kmSqSide)
    latBin, lonBin = binCoord(lat, lon, latSqSide)
    return f"{truncStr(latBin)}/{truncStr(lonBin)}/{res}"

def h3_to_geo_corner(h3str):
    strLat, strLon, _ = h3str.split('/')
    return float(strLat), float(strLon)

def h3_to_res(h3str):
    strLat, strLon, res = h3str.split('/')
    return int(res)

# distance in deg
def h3_distance(idCenter, idCorner):
    centerLat, centerLon = h3_to_geo_corner(idCenter)
    cornerLat, cornerLon = h3_to_geo_corner(idCorner)
    distLat = centerLat - cornerLat
    distLon = centerLon - cornerLon
    return math.sqrt(distLat ** 2 + distLon ** 2)

# radius in deg, side = radius * 2
def k_ring(idCenter, radius):

    sqs = set()
    res = h3_to_res(idCenter)
    lat, lon = h3_to_geo_corner(idCenter)

    sideLen = resToDegSide(res)

    sqLenHalf = radius
    numSquaresHalf = math.ceil(sqLenHalf / sideLen)

    for dx in range(-numSquaresHalf, numSquaresHalf + 2):
        for dy in range(-numSquaresHalf, numSquaresHalf + 2):
            sqs.add(geo_to_h3(lat + dy * sideLen, lon + dx * sideLen, res))

    return list(sqs)

def h3_to_bounds(hex):
    lat, lon = h3_to_geo_corner(hex)
    res = h3_to_res(hex)
    sideDeg = resToDegSide(res)
    return [
        (lon, lat + sideDeg),
        (lon + sideDeg, lat + sideDeg),
        (lon + sideDeg, lat),
        (lon, lat),
        (lon, lat + sideDeg),
    ]

def h3_set_to_multi_polygon(hexes, isgeo):
    feats = []
    for hex in hexes:
        feats.append(h3_to_bounds(hex))
    return [feats]

    # center = geo_to_h3(center_lat, center_lon, res)
    # radius = h3_distance(center, geo_to_h3(bbox[1], bbox[0], res))
    # hexes = k_ring(center, radius)

MMIN = 3
MMAX = 4

SCENS = [

    "bl_h000",
]

DU_AREA_MULT = 1 # / 6e8
GW_AREA_MULT = 1 # / 6e7

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

def var_1D(arr):
    if len(arr) == 0:
        return 0
    
    mean = avg_1D(arr)
    return sum([(x - mean) ** 2 for x in arr]) / len(arr)

def var_2D(rgs):    
    mi_arr = []

    if len(rgs) != 0:
        for j in range(0, len(rgs[0])):
            # round to truncate numbers in final data file
            mi_arr.append(int(round(var_1D([a[j] for a in rgs]))))

    return mi_arr

def weighted_var_1D(arr, weights):
    if len(arr) == 0:
        return 0
    
    mean = weighted_avg_1D(arr, weights)
    return sum([(x - mean) ** 2 for x in arr]) / len(arr)

def weighted_var_2D(rgs, weights):    
    mi_arr = []

    if len(rgs) != 0:
        for j in range(0, len(rgs[0])):
            # round to truncate numbers in final data file
            mi_arr.append(int(round(weighted_var_1D([a[j] for a in rgs], weights))))

    return mi_arr


def weighted_avg_1D(arr, weights):
    return sum([a * w if a is not None else 0 for a, w in zip(arr, weights)])

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

# version of polygonToCells that includes all hexagons covering polygon, not just hexagons with its centroid in the polygon
def polygon_to_cells(geometry, res):
    bbox = turf_bbox(geometry)
    center_lon = bbox[0] + (bbox[2] - bbox[0]) / 2
    center_lat = bbox[1] + (bbox[3] - bbox[1]) / 2
    center = geo_to_h3(center_lat, center_lon, res)
    radius = h3_distance(center, geo_to_h3(bbox[1], bbox[0], res))
    hexes = k_ring(center, radius)

    cells = []

    for hx in hexes:
        hxfeat = {
                "type": "MultiPolygon",
                "coordinates": h3_set_to_multi_polygon([hx], True)
            }
        intsection = turf_intersect([hxfeat, geometry])
        if intsection:
            cells.append(hx)

    return cells

def find_in(arr, cond):
    return next(elem for elem in arr if cond(elem))


def truncate_data(datafile):
    for feats in datafile["features"]:
        for k in feats["properties"]:
            l = feats["properties"][k]

            if type(l) is list:
                feats["properties"][k] = [int(round(a)) for a in l]                
            elif type(l) is dict:
                for ll in l:
                    l[ll] = [int(round(a)) for a in l[ll]]

    return datafile

# Load files 

county_regions = ujson.load(open("county_subdiv_simple.json"))
precinct_regions = ujson.load(open("precinct_geo_simple.json"))

county_regions_by_id = {}
precinct_regions_by_id = {}

# County population density

for region in county_regions["features"]:
    props = region["properties"]
    props["id"] = props["GEOID"]
    area = props["area"] / 1e6 * DU_AREA_MULT

    props["Population per Sqkm"] = props["county_subdivision_dec_Total population"] / area

    county_regions_by_id[props["GEOID"]] = region

for region in precinct_regions["features"]:
    props = region["properties"]
    props["id"] = props["GEOID"]

    precinct_regions_by_id[props["GEOID"]] = region

# For each reses:
#   Convert multipolygons to hexes (map of hexes -> array of DU_IDs and array of groundwaters)
#   Aggregate info and scale to hex/(total region occupied by georegions) intersection, also attach info on arrays of DU_IDS and groundwaters

final_hex_json = {}

for res in range(MMIN, MMAX + 1):
    hex_to_props = {}
    hex_to_regions = {}

    for region in county_regions["features"]:
        id = region["properties"]["id"]
        geom = region["geometry"]

        for cell in polygon_to_cells(geom, res):
            if cell not in hex_to_regions:
                hex_to_regions[cell] = {
                    "precinct_rgs": [],
                    "county_rgs": []
                }
            
            hex_to_regions[cell]["county_rgs"].append(id)

    for region in precinct_regions["features"]:
        id = region["properties"]["id"]
        geom = region["geometry"]

        for cell in polygon_to_cells(geom, res):
            if cell not in hex_to_regions:
                hex_to_regions[cell] = {
                    "precinct_rgs": [],
                    "county_rgs": []
                }
            
            hex_to_regions[cell]["precinct_rgs"].append(id)

    for hx in hex_to_regions:
        county_rgs = hex_to_regions[hx]["county_rgs"]
        precinct_rgs = hex_to_regions[hx]["precinct_rgs"]


        # make sure we have both demand and groundwater information in this hex
        if not (precinct_rgs and county_rgs):
            continue
        
        hxfeat = {
                "type": "MultiPolygon",
                "coordinates": h3_set_to_multi_polygon([hx], True)
            }

        intersect_factors = []
        total_occupied_space = sum([turf_area(FeatureCollection([turf_intersect([hxfeat, county_regions_by_id[rg]["geometry"]])])) * county_regions_by_id[rg]["properties"]["Population per Sqkm"] for rg in county_rgs]) * DU_AREA_MULT

        for rg in county_rgs:
            intersect_factors.append(((turf_area(FeatureCollection([turf_intersect([hxfeat, county_regions_by_id[rg]["geometry"]])])) * county_regions_by_id[rg]["properties"]["Population per Sqkm"] * DU_AREA_MULT) / total_occupied_space) if total_occupied_space > 0 else 0 )

        newprops = {}

        def find_props_ordered(prop_name):
            prop_arr = []
            for rg in county_rgs:
                reg_feat = find_in(county_regions["features"], lambda e: e["properties"]["id"] == rg)
                prop_arr.append(reg_feat["properties"][prop_name])
            return prop_arr

        def weight_by_prop(prop_name):
            prop_arr = []
            for rg in county_rgs:
                reg_feat = find_in(county_regions["features"], lambda e: e["properties"]["id"] == rg)
                prop_arr.append(reg_feat["properties"][prop_name])
            return weighted_avg_1D(prop_arr, intersect_factors)


        newprops["PopSqKm"] = weighted_avg_1D(find_props_ordered("Population per Sqkm"), intersect_factors)
        newprops["PopSqKmVar"] = weighted_var_1D(find_props_ordered("Population per Sqkm"), intersect_factors)
        
        newprops["PercWhite"] = weight_by_prop("county_subdivision_dec_Percent White")
        newprops["PercWhiteVar"] = weighted_var_1D(find_props_ordered("county_subdivision_dec_Percent White"), intersect_factors)
        
        intersect_factors = []
        total_occupied_space = sum([turf_area(FeatureCollection([turf_intersect([hxfeat, precinct_regions_by_id[rg]["geometry"]])])) * precinct_regions_by_id[rg]["properties"]["votes_per_sqkm"] for rg in precinct_rgs])

        for rg in precinct_rgs:
            intersect_factors.append(((turf_area(FeatureCollection([turf_intersect([hxfeat, precinct_regions_by_id[rg]["geometry"]])])) * precinct_regions_by_id[rg]["properties"]["votes_per_sqkm"]) / total_occupied_space) if total_occupied_space > 0 else 0)
            
        def find_props_ordered(prop_name):
            prop_arr = []
            for rg in precinct_rgs:
                reg_feat = find_in(precinct_regions["features"], lambda e: e["properties"]["id"] == rg)
                prop_arr.append(reg_feat["properties"][prop_name])
            return prop_arr

        def weight_by_prop(prop_name):
            prop_arr = []
            for rg in precinct_rgs:
                reg_feat = find_in(precinct_regions["features"], lambda e: e["properties"]["id"] == rg)
                # if reg_feat["properties"][prop_name] is None:
                #     print(rg)
                #     print(reg_feat["properties"])
                prop_arr.append(reg_feat["properties"][prop_name])
            return weighted_avg_1D(prop_arr, intersect_factors)

        newprops["DemLead"] = weight_by_prop("pct_dem_lead")
        newprops["VotesPerSqKm"] = weight_by_prop("votes_per_sqkm")
        newprops["TurnoutPerSqKm"] = newprops["VotesPerSqKm"] / newprops["PopSqKm"] * 100
        
        newprops["CountyRgs"] = county_rgs
        newprops["PrecinctRgs"] = precinct_rgs

        hex_to_props[hx] = newprops

    final_hex_json[str(res)] = hex_to_props


# Write JSON

with open(f"election_square_{MMIN}_{MMAX}.json", "w") as outfile:
    ujson.dump(final_hex_json, outfile)

with open(f"county_geo.json", "w") as outfile:
    ujson.dump(truncate_data(county_regions), outfile)

with open(f"precinct_geo.json", "w") as outfile:
    ujson.dump(truncate_data(precinct_regions), outfile)