from PIL import Image
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
from turfpy.measurement import boolean_point_in_polygon as turf_boolean_point_in_polygon
from turfpy.transformation import intersect as turf_intersect
from geojson import Feature, FeatureCollection, Point, MultiPolygon
from process_utils import *
import requests

MMIN = 7
MMAX = 8

Z = 10

def hex_feat(hexId):
    return Feature(
        geometry=MultiPolygon(h3.h3_set_to_multi_polygon([hexId], True)
    )
)

im_cache = {}

def get_im(tx, ty, z):
    if (tx, ty) not in im_cache:
        im_cache[(tx, ty)] = Image.open(requests.get(f"http://infovis.cs.ucdavis.edu/mapProxy/wmts/fbfm40/webmercator/{Z}/{tx}/{ty}.png", stream=True).raw).convert('RGB')
    return im_cache[(tx, ty)]

def get_raster_data(cellId):
    count = 0
    total = 0
    for xTile, yTile in hex_to_tiles(cellId, Z):
        im = get_im(xTile, yTile, Z)
        hexfeat = hex_feat(cellId)
        
        imwidth, imheight = im.size
        pixel_values = list(im.getdata())

        for y in range(imheight):
            for x in range(imwidth):
                lat, lon = tile_px_to_lat_lon(xTile, yTile, x / imwidth, y / imheight, Z)

                if turf_boolean_point_in_polygon(Feature(geometry=Point([lon, lat])), hexfeat):
                    # print(pixel_values[imwidth * y + x])
                    (r, g, b) = pixel_values[imwidth * y + x]

                    if r == 255 and g == 210 and b == 114:
                        count += 1
                    total += 1
    print(f"count {count}")
    print(f"total {total}")
    return {
        "GR2": count / total if total != 0 else 0
    }

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
            "power": float(wildfire_point["power"]),
        }
        
        hx = h3.geo_to_h3(lat, lon, res)

        if hx not in hex_to_regions:
            hex_to_regions[hx] = {
                'fire': [],
                'people': [],
                "raster_data": get_raster_data(hx)
            }
        
        hex_to_regions[hx]['fire'].append(pointProps)

    for personnel_point in personnel_points:
        lat, lon = personnel_point["coordinates"]
        hx = h3.geo_to_h3(lat, lon, res)
        
        pointProps = {
            "confidence": 1,
            "count": personnel_point["personnel"]
        }

        if hx not in hex_to_regions:
            hex_to_regions[hx] = {
                'fire': [],
                'people': [],
                "raster_data": get_raster_data(hx)
            }
        
        hex_to_regions[hx]['people'].append(pointProps)
        

    for hx in hex_to_regions:
        newprops = {}

        newprops["Fire"] = avg_1D(list(map(lambda props: props['power'], hex_to_regions[hx]['fire'])))
        newprops["FireVar"] = avg_1D(list(map(lambda props: 100 - props['confidence'], hex_to_regions[hx]['fire'])))

        newprops["Pers"] = avg_1D(list(map(lambda props: props['count'], hex_to_regions[hx]['people'])))
        newprops["PersVar"] = avg_1D(list(map(lambda props: 1 - props['confidence'], hex_to_regions[hx]['people'])))

        newprops["GR2"] = hex_to_regions[hx]['raster_data']['GR2']

        hex_to_props[hx] = newprops

    final_hex_json[str(res)] = hex_to_props


# Write JSON

with open(f"wildfire_hex_{MMIN}_{MMAX}.json", "w") as outfile:
    ujson.dump(final_hex_json, outfile)