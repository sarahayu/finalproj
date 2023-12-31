import urllib.request, ujson, shapely, h3
from functools import reduce
import math
import area
from PIL import Image
import string

MMIN = 5
MMAX = 6
RES = 100
ATTRS = [
    "UnmetDemandBaseline",
    "DemandBaseline",
    # "Difference",
    # "DemandDifference",
]
SCEN_ATTRS = [
    "UnmetDemand",
    "Demand",
]
SCENS = [
    "bl_h000",
    "CS3_ALT3_2022med_L2020ADV",
    "LTO_BA_EXP1_2022MED",
]

def latlngToMerc(lat, lon):
    z = 5

    latRad = lat * 3.141593 / 180
    n = pow(2, z)
    xTile = n * ((lon + 180) / 360)
    yTile = n * (1-(math.log(math.tan(latRad) + 1 / math.cos(latRad)) / 3.141593)) / 2

    return xTile - math.floor(xTile), yTile - math.floor(yTile)

# function avg(arr) {
#   return arr.reduce((a, b) => a + b) / arr.length
# }

def avg(arr): 
    if len(arr) == 0:
        return 0
    return reduce(lambda a, b: a + b, arr) / len(arr) 


# const avgArrOfArr = arr => {
#     let avgArr = []

#     for (let j = 0; j < arr[0].length; j++) {
#         avgArr.push(arr.map(a => Number(a[j])).reduce((a, b) => (a + b)) / arr.length)
#     }

#     return avgArr
# }

def avgArrOfArr(arr):
    
    avgArr = []

    if len(arr) != 0:
        for j in range(0, len(arr[0])):
            if j != 1201:
                # print(j)
                avgArr.append(int(round(avg([float(a[j]) for a in arr]))))

    return avgArr

def maxCounter(arr):
    keeptrack = {}
    for a in arr:
        if a not in keeptrack:
            keeptrack[a] = 0
        keeptrack[a] += 1
    
    sorteds = [k for k, _ in sorted(keeptrack.items(), key=lambda item: item[1], reverse=True)]
    return sorteds


# function avgObject(arrObjs) {  
#   let avgObj = {}

#   let propsToAvg = Object.keys(arrObjs[0] || {})

#   // avgObj[propsToAvg[0]] = noise.simplex2(centerLat * 10, centerLng *10);
#   // avgObj[propsToAvg[1]] = noise2.simplex2(centerLat * 10, centerLng *10);

#   propsToAvg.forEach(propToAvg => {
#     avgObj[propToAvg] = avg(arrObjs.map(hexPoint => hexPoint[propToAvg]))
#     // avgObj[propToAvg] = value / 2 + 0.5
#   })

#   return avgObj
# }
def avgGroundwater(arrObjs):
    avgArr = avgArrOfArr([ [obj["Groundwater"][k] for k in obj["Groundwater"]] for obj in arrObjs])
    return {
        "Groundwater": avgArr,
        "GroundwaterAverage": avg(avgArr)
    }
def avgDiffUnmet(arrObjs):
    averagedObj = {}
    if "UnmetDemandBaseline" in ATTRS: 
        avgArr = avgArrOfArr([ obj["UnmetDemandBaseline"] for obj in arrObjs])
        averagedObj["UnmetDemandBaseline"] = avgArr
        averagedObj["UnmetDemandBaselineAverage"] = avg(avgArr)
    if "DemandBaseline" in ATTRS: 
        avgArr = avgArrOfArr([ obj["DemandBaseline"] for obj in arrObjs])
        averagedObj["DemandBaseline"] = avgArr
        averagedObj["DemandBaselineAverage"] = avg(avgArr)
    if "UnmetDemand" in SCEN_ATTRS: 
        averagedObj["UnmetDemand"] = {}
        averagedObj["UnmetDemandAverage"] = {}
        for scen in SCENS:
            avgArr = avgArrOfArr([ obj["UnmetDemand"][scen] for obj in arrObjs])
            averagedObj["UnmetDemand"][scen] = avgArr
            averagedObj["UnmetDemandAverage"][scen] = avg(avgArr)
    if "Demand" in SCEN_ATTRS: 
        averagedObj["Demand"] = {}
        averagedObj["DemandAverage"] = {}
        for scen in SCENS:
            avgArr = avgArrOfArr([ obj["Demand"][scen] for obj in arrObjs])
            averagedObj["Demand"][scen] = avgArr
            averagedObj["DemandAverage"][scen] = avg(avgArr)

    return averagedObj
def aggLandUse(arrObjs):
    return {
        "LandUse": maxCounter([ obj["LandUse"] for obj in arrObjs]),
    }

# function flatten(arr) {  
#   return [].concat.apply([], arr)
# }

# https://stackoverflow.com/a/952952
def flatten(arr):
    return [[float(i) for i in item] for sublist in arr for item in sublist]

# /**
#  * 
#  * returns array of points
#  * [[lat1, lon1], [lat2, lon2], ...]
#  */
# function polygonToPoints(dataFeature) {
#   let points = []

#   // How to flatten array: https://stackoverflow.com/a/10865042
#   let flattenedCoords = flatten(dataFeature.geometry.coordinates)

#   let lons = flattenedCoords.map(entry => entry[0])
#   let lats = flattenedCoords.map(entry => entry[1])
  
#   let bounds = {
#     minLat: Math.min(...lats),
#     maxLat: Math.max(...lats),
#     minLon: Math.min(...lons),
#     maxLon: Math.max(...lons),
  
#   }

#   let stepSize = 0.01

#   for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += stepSize) {
#     for (let lon = bounds.minLon; lon <= bounds.maxLon; lon += stepSize) {
#       if (d3Geo.geoContains(dataFeature, [lon, lat])) {
#         points.push([lon, lat])
#       }
#     }
#   }


#   return points
# }

def geoContains(poly, coord):    
    point = shapely.geometry.Point(coord[0], coord[1])
    # polygon = shapely.geometry.polygon.Polygon([(polycoord[0], polycoord[1]) for polycoord in poly])
    # print(coord)
    # print([(polycoord[0], polycoord[1]) for polycoord in poly])
    return poly.contains(point)

def polygonToPoints(dataFeature):
    points = []

    flattenedCoords = flatten(dataFeature["geometry"]["coordinates"])

    lons = [entry[0] for entry in flattenedCoords]
    lats = [entry[1] for entry in flattenedCoords]
    
    minLat = min(lats)
    maxLat = max(lats)
    minLon = min(lons)
    maxLon = max(lons)

    # if maxLat < 38.54:
    #     return points

    # print(minLat)
    # print(maxLat)

    scale = 50
    stepSize = 1 / scale

    poly = shapely.geometry.polygon.Polygon([(polycoord[0], polycoord[1]) for polycoord in flattenedCoords])
    for lat in range(int(scale * minLat), int(scale * (maxLat + 1)), int(scale * stepSize)):
        for lon in range(int(scale * minLon), int(scale * (maxLon + 1)), int(scale * stepSize)):
            if geoContains(poly, [lon / scale, lat / scale]):
                points.append([lon / scale, lat / scale])

    return points

# /**
#  * 
#  * returns array of points and properties
#  * [[lat1, lon1, propInd1], [lat2, lon2, propInd2], ...]
#  */
# export function geojsonToGridPoints(dataFeatures) {
#   let points = []

#   dataFeatures.forEach(feature => {
#     let regionPoints = polygonToPoints(feature)
#     points.push(...regionPoints.map(coord => [...coord, feature.properties]))
#   })

#   return points
# }

def geojsonToGridPoints(dataFeatures):
    points = []

    ind = 0

    for feature in dataFeatures:
        regionPoints = polygonToPoints(feature)
        # print(regionPoints)
        points.extend([coord[0], coord[1], ind] for coord in regionPoints)
        ind += 1

    return points

# /**
#  * 
#  * returns array of array of hexids and avgProperty, ordered by resolution
#  * [
#  *  [[hexId1, avgProperties1], [hexId2, avgProperties2], ...],    // lowest resolution, larger hexagons
#  *  [[hexId1, avgProperties1], [hexId2, avgProperties2], ...],
#  *  [[hexId1, avgProperties1], [hexId2, avgProperties2], ...],    // highest resoultion, smaller hexagons
#  * ]
#  */
# function gridPointsToHexPoints(gridPoints, averageFn, resRange) {

#   let resPoints = []
#   let [minRes, maxRes] = resRange

#   for (let res = minRes; res <= maxRes; res++) {
    
#     let binnedPoints = {}

#     gridPoints.forEach(point => {
#       let hexId = h3.latLngToCell(point[1], point[0], res)

#       if (hexId in binnedPoints) {
#         binnedPoints[hexId].push(point[2])
#       }
#       else {
#         binnedPoints[hexId] = [ point[2] ]
#       }
#     })

#     let points = []

#     for (let hexId in binnedPoints) {
#       points.push([hexId, averageFn(binnedPoints[hexId], hexId)])
#     }

#     resPoints.push(points)
#   }

#   return resPoints
# }

def gridPointsToHexPoints(dataFeatures, gridPoints, averageFn, resRange):
    resPoints = {}

    minRes, maxRes = resRange

    im = Image.open('elevcorr.png', 'r')
    imwidth, imheight = im.size
    pixel_values = list(im.getdata())
    
    for res in range(minRes, maxRes + 1):
        binnedPoints = {}

        for point in gridPoints:
            lat, lon = point[1], point[0]

            hexId = h3.latlng_to_cell(lat, lon, res)

            if hexId in binnedPoints:
                binnedPoints[hexId].append(point[2])
            else:
                binnedPoints[hexId] = [ point[2] ]

        points = {}

        idd = 0

        for hexId in binnedPoints:
            lat, lon = h3.cell_to_latlng(hexId)
            x, y = latlngToMerc(lat, lon)

            x = math.floor(x * imwidth)
            y = math.floor(y * imheight)

            (r, g, b, _) = pixel_values[imwidth * y + x]
            elev = ((r * 256 + g * 1 + b * 1 / 256) - 32768)
            
            avgObj = averageFn([dataFeatures[ind]["properties"] for ind in binnedPoints[hexId]])

            avgObj["Elevation"] = elev
            
            points[hexId] = avgObj

            idd += 1

        resPoints[res] = points

    return resPoints

# def idToVal(idStr):
#     lastPart = idStr.rstrip(string.digits)[-2:]
#     if lastPart == "SA" or lastPart == "XA" or lastPart == "PA" or lastPart == "NA":
#         return 0
#     if lastPart == "SU" or lastPart == "PU" or lastPart == "NU":
#         return 1
#     return 2
    

def idToVal(idStr):
    lastPart = idStr.rstrip(string.digits)[-2:]
    if lastPart == "SA" or lastPart == "SU":
        return 0
    if lastPart == "XA":
        return 1
    if lastPart == "PA" or lastPart == "PU" or lastPart == "PR":
        return 2
    return 3

# /**
#  * 
#  * returns array of array of hexids and avgProperty, ordered by resolution
#  * [
#  *  [[hexId1, avgProperties1], [hexId2, avgProperties2], ...],    // lowest resolution, larger hexagons
#  *  [[hexId1, avgProperties1], [hexId2, avgProperties2], ...],
#  *  [[hexId1, avgProperties1], [hexId2, avgProperties2], ...],    // highest resoultion, smaller hexagons
#  * ]
#  */
# function geojsonToHexPoints(dataFeatures, avgFn, resRange) {
#   let gridPoints = geojsonToGridPoints(dataFeatures)
#   let hexPoints = gridPointsToHexPoints(gridPoints, avgFn, resRange)
#   return hexPoints
# }

def geojsonToHexPoints(dataFeatures, avgFn, resRange):
    gridPoints = geojsonToGridPoints(dataFeatures)
    hexPoints = gridPointsToHexPoints(dataFeatures, gridPoints, avgFn, resRange)

    return hexPoints
 
# Opening JSON file
with urllib.request.urlopen("http://infovis.cs.ucdavis.edu/geospatial/api/shapes/demand_units") as region_file, \
    urllib.request.urlopen("http://infovis.cs.ucdavis.edu/geospatial/api/data/scenario/CS3_BL/unmetdemand") as temporal_file_bl, \
    urllib.request.urlopen("http://infovis.cs.ucdavis.edu/geospatial/api/data/scenario/CS3_BL/demand") as temporal_file_dem_bl:
 
    # Reading from json file
    region_object = ujson.load(region_file)
    temporal_bl_object = ujson.load(temporal_file_bl)
    temporal_dem_bl_object = ujson.load(temporal_file_dem_bl)

    temporal_objects = {}
    temporal_dem_objects = {}

    
    for idd in temporal_dem_bl_object:
        temporal_bl_object[idd] = list(temporal_bl_object[idd].values())
        temporal_dem_bl_object[idd] = list(temporal_dem_bl_object[idd].values())

        if temporal_dem_bl_object[idd][0] is None or temporal_dem_bl_object[idd][0] < 0:
            temporal_bl_object[idd] = [0] * len(temporal_bl_object[idd])
            temporal_dem_bl_object[idd] = [0] * len(temporal_dem_bl_object[idd])

    for scen in SCENS:
        with urllib.request.urlopen(f"http://infovis.cs.ucdavis.edu/geospatial/api/data/scenario/{scen}/unmetdemand") as temporal_file, \
            urllib.request.urlopen(f"http://infovis.cs.ucdavis.edu/geospatial/api/data/scenario/{scen}/demand") as temporal_file_dem:
            temporal_object = ujson.load(temporal_file)
            temporal_dem_object = ujson.load(temporal_file_dem)

            for idd in temporal_dem_object:
                temporal_object[idd] = list(temporal_object[idd].values())
                temporal_dem_object[idd] = list(temporal_dem_object[idd].values())

                if temporal_dem_object[idd][0] is None or temporal_dem_object[idd][0] < 0:
                    temporal_object[idd] = [0] * len(temporal_object[idd])
                    temporal_dem_object[idd] = [0] * len(temporal_dem_object[idd])

            temporal_objects[scen] = temporal_object
            temporal_dem_objects[scen] = temporal_dem_object

    tot_areas = {}
    
    new_fs = [f for f in region_object["features"] if f["properties"]["DU_ID"] and f["properties"]["DU_ID"] in temporal_bl_object and f["properties"]["DU_ID"] in temporal_dem_bl_object and all(f["properties"]["DU_ID"] in scen_objs for scen_objs in list(temporal_objects.values())) and all(f["properties"]["DU_ID"] in scen_objs for scen_objs in list(temporal_dem_objects.values()))]
    
    for f in new_fs:
        idd = f["properties"]["DU_ID"]

        if idd not in tot_areas:
            tot_areas[idd] = 0

        tot_areas[idd] += area.area(f["geometry"]) / 6e8


    for f in new_fs:
        idd = f["properties"]["DU_ID"]
        rea = tot_areas[idd]
        if "UnmetDemandBaseline" in ATTRS: f["properties"]["UnmetDemandBaseline"] = [(temporal_bl_object[idd][i]) / rea for i in range(len(temporal_bl_object[idd]))]
        if "DemandBaseline" in ATTRS: f["properties"]["DemandBaseline"] = [(temporal_dem_bl_object[idd][i]) / rea for i in range(len(temporal_dem_bl_object[idd]))]
        if "UnmetDemand" in SCEN_ATTRS: 
            f["properties"]["UnmetDemand"] = {}
            for scen in SCENS:
                f["properties"]["UnmetDemand"][scen] = [(temporal_objects[scen][idd][i]) / rea for i in range(len(temporal_objects[scen][idd]))]
        if "Demand" in SCEN_ATTRS: 
            f["properties"]["Demand"] = {}
            for scen in SCENS:
                f["properties"]["Demand"][scen] = [(temporal_dem_objects[scen][idd][i]) / rea for i in range(len(temporal_dem_objects[scen][idd]))]
        # if "Difference" in ATTRS: f["properties"]["Difference"] = [(temporal_object[idd][i] - temporal_bl_object[idd][i]) / rea for i in range(len(temporal_object[idd]))]
        # if "DemandDifference" in ATTRS: f["properties"]["DemandDifference"] = [(temporal_dem_object[idd][i] - temporal_dem_bl_object[idd][i]) / rea for i in range(len(temporal_dem_object[idd]))]

    region_object["features"] = new_fs

        
    with open(f"diff_unmet_hex_{MMIN}_{MMAX}_{RES}.json", "w") as outfile:

        hex_object = geojsonToHexPoints(region_object["features"], avgDiffUnmet, [MMIN, MMAX])

        ujson.dump(hex_object, outfile)

# Opening JSON file
with urllib.request.urlopen("http://infovis.cs.ucdavis.edu/geospatial/api/shapes/demand_units") as region_file:
 
    # Reading from json file
    region_object = ujson.load(region_file)

    new_fs = [f for f in region_object["features"] if f["properties"]["DU_ID"]]

    for f in new_fs:
        idd = f["properties"]["DU_ID"]
        f["properties"]["LandUse"] = idToVal(idd)

    region_object["features"] = new_fs

        
    with open(f"landuse_hex_{MMIN}_{MMAX}_{RES}.json", "w") as outfile:

        hex_object = geojsonToHexPoints(region_object["features"], aggLandUse, [MMIN, MMAX])

        ujson.dump(hex_object, outfile)

# Opening JSON file
with open("baseline_groundwater.json") as region_file:
 
    # Reading from json file
    region_object = ujson.load(region_file)

        
    with open(f"groundwater_hex_{MMIN}_{MMAX}_{RES}.json", "w") as outfile:

        hex_object = geojsonToHexPoints(region_object["features"], avgGroundwater, [MMIN, MMAX])

        ujson.dump(hex_object, outfile)
    