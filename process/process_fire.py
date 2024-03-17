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

MMIN = 7
MMAX = 9

SCENS = [

    "bl_h000",
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

wildfire_points = ujson.load(open("wildfire.json"))
personnel_points = ujson.load(open("personnel.json"))

final_hex_json = {}

for res in range(MMIN, MMAX + 1):
    hex_to_props = {}
    hex_to_regions = {}

    for wildfire_point in wildfire_points:
        lon, lat = wildfire_point["centroid"]["coordinates"][0], wildfire_point["centroid"]["coordinates"][1]
        
        pointProps = {
            "confidence": wildfire_point["confidence"],
            "power": wildfire_point["power"],
        }
        
        hx = h3.geo_to_h3(lat, lon, res)

        if hx not in hex_to_regions:
            hex_to_regions[hx] = {
                'fire': [],
                'people': []
            }
        
        hex_to_regions[hx]['fire'].append(pointProps)

    for personnel_point in personnel_points:
        lat, lon = personnel_point["coordinates"]
        hx = h3.geo_to_h3(lat, lon, res)

        if hx not in hex_to_regions:
            hex_to_regions[hx] = {
                'fire': [],
                'people': []
            }
        
        hex_to_regions[hx]['people'].append(personnel_point["personnel"])

    for hx in hex_to_regions:
        
        newprops = {
            "confidence": int(round(avg_1D([ obj["confidence"] for obj in hex_to_regions[hx]['fire']]))),
            "power": int(round(avg_1D([ float(obj["power"]) for obj in hex_to_regions[hx]['fire']]))),
            "personnel": int(round(avg_1D(hex_to_regions[hx]["people"]) * 100)),
        }

        hex_to_props[hx] = newprops

    final_hex_json[str(res)] = hex_to_props


# Write JSON

with open(f"fire_hex_{MMIN}_{MMAX}.json", "w") as outfile:
    ujson.dump(final_hex_json, outfile)