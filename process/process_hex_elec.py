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

MMIN = 3
MMAX = 4


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
            mi_arr.append(
                int(round(weighted_var_1D([a[j] for a in rgs], weights))))

    return mi_arr


def weighted_avg_1D(arr, weights):
    return sum([a * w if a is not None else 0 for a, w in zip(arr, weights)])


def weighted_avg_2D(arr, weights):

    avg_arr = []

    if len(arr) != 0:
        for j in range(0, len(arr[0])):
            # round to truncate numbers in final data file
            avg_arr.append(
                int(round(weighted_avg_1D([a[j] for a in arr], weights))))

    return avg_arr


def weighted_mode(arr, weights):
    keeptrack = {}
    for a, w in zip(arr, weights):
        if a not in keeptrack:
            keeptrack[a] = 0
        keeptrack[a] += w

    sorteds = [
        k for k,
        _ in sorted(
            keeptrack.items(),
            key=lambda item: item[1],
            reverse=True)]
    return sorteds

# version of h3.polygonToCells that includes all hexagons covering
# polygon, not just hexagons with its centroid in the polygon


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
            "coordinates": h3.h3_set_to_multi_polygon([hx], True)
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
    
    area = props["area"] / 1e6
    props["id"] = props["GEOID"]
    props["PoCCount"] = 100 - props["county_subdivision_dec_Percent White"]
    props["Population per Sqkm"] = props["county_subdivision_dec_Total population"] / area

    county_regions_by_id[props["GEOID"]] = region

for region in precinct_regions["features"]:
    props = region["properties"]

    area = turf_area(FeatureCollection([region])) / 1e6
    props["id"] = props["GEOID"]
    props["DemLeadCount"] = props["pct_dem_lead"] if props["pct_dem_lead"] is not None else 0

    precinct_regions_by_id[props["GEOID"]] = region

# For each reses:
#   Convert multipolygons to hexes (map of hexes -> array of DU_IDs and array of groundwaters)
# Aggregate info and scale to hex/(total region occupied by georegions)
# intersection, also attach info on arrays of DU_IDS and groundwaters

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
            "coordinates": h3.h3_set_to_multi_polygon([hx], True)
        }

        weights_spatial_density = []
        total_space_density_value = sum(
            [
                turf_area(
                    FeatureCollection(
                        [
                            turf_intersect(
                                [
                                    hxfeat,
                                    county_regions_by_id[rg]["geometry"]])])) *
                county_regions_by_id[rg]["properties"]["Population per Sqkm"] for rg in county_rgs])

        for rg in county_rgs:
            weights_spatial_density.append(
                ((turf_area(
                    FeatureCollection(
                        [
                            turf_intersect(
                                [
                                    hxfeat,
                                    county_regions_by_id[rg]["geometry"]])])) *
                  county_regions_by_id[rg]["properties"]["Population per Sqkm"]) /
                 total_space_density_value) if total_space_density_value > 0 else 0)

        weights_spatial = []
        total_space_value = sum([turf_area(FeatureCollection([turf_intersect(
            [hxfeat, county_regions_by_id[rg]["geometry"]])])) for rg in county_rgs])

        for rg in county_rgs:
            weights_spatial.append(((turf_area(FeatureCollection([turf_intersect(
                [hxfeat, county_regions_by_id[rg]["geometry"]])]))) / total_space_value) if total_space_value > 0 else 0)

        newprops = {}

        def find_props_ordered(prop_name):
            prop_arr = []
            for rg in county_rgs:
                reg_feat = find_in(
                    county_regions["features"],
                    lambda e: e["properties"]["id"] == rg)
                prop_arr.append(reg_feat["properties"][prop_name])
            return prop_arr

        # newprops["Pop"] = weighted_avg_1D(find_props_ordered(
        #     "county_subdivision_dec_Total population"), weights_spatial)
        # newprops["PopVar"] = weighted_var_1D(find_props_ordered(
        #     "county_subdivision_dec_Total population"), weights_spatial)

        newprops["PopSqKm"] = weighted_avg_1D(
            find_props_ordered("Population per Sqkm"), weights_spatial)
        newprops["PopSqKmVar"] = weighted_var_1D(
            find_props_ordered("Population per Sqkm"), weights_spatial)

        newprops["PoC"] = weighted_avg_1D(
            find_props_ordered("PoCCount"),
            weights_spatial_density)
        newprops["PoCVar"] = weighted_var_1D(
            find_props_ordered("PoCCount"),
            weights_spatial_density)

        weights_spatial_density = []
        total_space_density_value = sum(
            [
                turf_area(
                    FeatureCollection(
                        [
                            turf_intersect(
                                [
                                    hxfeat,
                                    precinct_regions_by_id[rg]["geometry"]])])) *
                precinct_regions_by_id[rg]["properties"]["votes_per_sqkm"] for rg in precinct_rgs])

        for rg in precinct_rgs:
            weights_spatial_density.append(
                ((turf_area(
                    FeatureCollection(
                        [
                            turf_intersect(
                                [
                                    hxfeat,
                                    precinct_regions_by_id[rg]["geometry"]])])) *
                  precinct_regions_by_id[rg]["properties"]["votes_per_sqkm"]) /
                 total_space_density_value) if total_space_density_value > 0 else 0)

        weights_spatial = []
        total_space_value = sum([turf_area(FeatureCollection([turf_intersect(
            [hxfeat, precinct_regions_by_id[rg]["geometry"]])])) for rg in precinct_rgs])

        for rg in precinct_rgs:
            weights_spatial.append(((turf_area(FeatureCollection([turf_intersect(
                [hxfeat, precinct_regions_by_id[rg]["geometry"]])]))) / total_space_value) if total_space_value > 0 else 0)

        def find_props_ordered(prop_name):
            prop_arr = []
            for rg in precinct_rgs:
                reg_feat = find_in(
                    precinct_regions["features"],
                    lambda e: e["properties"]["id"] == rg)
                prop_arr.append(reg_feat["properties"][prop_name])
            return prop_arr

        newprops["DemLead"] = weighted_avg_1D(
            find_props_ordered("DemLeadCount"),
            weights_spatial_density)
        newprops["DemLeadVar"] = weighted_var_1D(
            find_props_ordered("DemLeadCount"), weights_spatial_density)

        newprops["CountyRgs"] = county_rgs
        newprops["PrecinctRgs"] = precinct_rgs

        hex_to_props[hx] = newprops

    final_hex_json[str(res)] = hex_to_props


# Write JSON

with open(f"election_hex_{MMIN}_{MMAX}.json", "w") as outfile:
    ujson.dump(final_hex_json, outfile)

with open(f"county_geo.json", "w") as outfile:
    ujson.dump(truncate_data(county_regions), outfile)

with open(f"precinct_geo.json", "w") as outfile:
    ujson.dump(truncate_data(precinct_regions), outfile)
