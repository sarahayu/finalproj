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
from turfpy.transformation import intersect as turf_intersect
from geojson import Feature, FeatureCollection


def latlngToMerc(lat, lon, z = 10):

    latRad = lat * 3.141593 / 180
    n = pow(2, z)
    xTile = n * ((lon + 180) / 360)
    yTile = n * (1-(math.log(math.tan(latRad) + 1 / math.cos(latRad)) / 3.141593)) / 2

    return math.floor(xTile), math.floor(yTile)

# https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
def mercToLatLng(tileX, tileY, z = 10):
    n = pow(2, z)
    lon_deg = tileX / n * 360.0 - 180.0
    lat_rad = math.atan(math.sinh(3.141593 * (1 - 2 * tileY / n)))
    lat_deg = lat_rad * 180.0 / 3.141593

    return lat_deg, lon_deg

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
    return sum([a * w for a, w in zip(arr, weights)])


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

def hex_to_tiles(hexId, z = 10):

    # lat, lon
    [[vs]] = h3.h3_set_to_multi_polygon([hexId])

    furthest1 = vs[0]
    furthest2 = vs[3]

    diameter = math.sqrt(math.pow(furthest1[0] - furthest2[0], 2) + math.pow(furthest1[1] - furthest2[1], 2))

    tileX, tileY = latlngToMerc(furthest1[0] + diameter, furthest1[1] - diameter, z)
    tx = tileX
    ty = tileY

    while mercToLatLng(tx, ty, z)[0] > furthest1[0] - diameter:
        ty += 1

    while mercToLatLng(tx, ty, z)[1] < furthest1[1] + diameter:
        tx += 1

    tiles = []

    for x in range(0, tx - tileX):
        for y in range(0, ty - tileY):
            tiles.append([tileX + x, tileY + y])

    return tiles

def tile_px_to_lat_lon(tileX, tileY, uX, uY, Z):
    
    lat, lng = mercToLatLng(tileX, tileY, Z)
    lat2, lng2 = mercToLatLng(tileX + 1, tileY + 1, Z)
    dlat = lat2 - lat
    dlng = lng2 - lng

    res_lat = lat + dlat * uY
    res_lng = lng + dlng * uX

    return res_lat, res_lng