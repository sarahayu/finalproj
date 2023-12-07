import urllib.request, ujson, shapely, h3
from functools import reduce
import math
import area
from PIL import Image
import string

class RollingAvg():

    def __init__(self):
        self.cur_N = 0
        self.cur_avg = 0

    def add_to_avg(self, new_val, weight):
        # print(self.cur_avg)
        self.cur_N += weight
        self.cur_avg = self.cur_avg * (self.cur_N-weight)/self.cur_N + (new_val)/self.cur_N

    def get_avg(self):
        return self.cur_avg
 
# Opening JSON file
with urllib.request.urlopen("http://infovis.cs.ucdavis.edu/geospatial/api/shapes/demand_units") as region_file, \
    urllib.request.urlopen("http://infovis.cs.ucdavis.edu/geospatial/api/data/scenario/CS3_BL/unmetdemand") as temporal_file_bl, \
    urllib.request.urlopen("http://infovis.cs.ucdavis.edu/geospatial/api/data/scenario/bl_h000/unmetdemand") as temporal_file, \
    urllib.request.urlopen("http://infovis.cs.ucdavis.edu/geospatial/api/data/scenario/CS3_BL/demand") as temporal_file_dem_bl, \
    urllib.request.urlopen("http://infovis.cs.ucdavis.edu/geospatial/api/data/scenario/bl_h000/demand") as temporal_file_dem, \
    urllib.request.urlopen("http://infovis.cs.ucdavis.edu/geospatial/api/data/scenario/CS3_BL/supply") as temporal_file_supply_bl, \
    urllib.request.urlopen("http://infovis.cs.ucdavis.edu/geospatial/api/data/scenario/bl_h000/supply") as temporal_file_supply:
 
    # Reading from json file
    region_object = ujson.load(region_file)
    temporal_bl_object = ujson.load(temporal_file_bl)
    temporal_object = ujson.load(temporal_file)
    temporal_dem_bl_object = ujson.load(temporal_file_dem_bl)
    temporal_dem_object = ujson.load(temporal_file_dem)
    temporal_supply_bl_object = ujson.load(temporal_file_supply_bl)
    temporal_supply_object = ujson.load(temporal_file_supply)

    new_fs = [f for f in region_object["features"] if f["properties"]["DU_ID"] and f["properties"]["DU_ID"] in temporal_object and f["properties"]["DU_ID"] in temporal_dem_object]
    
    for idd in temporal_dem_object:
        temporal_object[idd] = list(temporal_object[idd].values())
        temporal_bl_object[idd] = list(temporal_bl_object[idd].values())
        temporal_dem_object[idd] = list(temporal_dem_object[idd].values())
        temporal_dem_bl_object[idd] = list(temporal_dem_bl_object[idd].values())
        temporal_supply_bl_object[idd] = list(temporal_supply_bl_object[idd].values())
        temporal_supply_object[idd] = list(temporal_supply_object[idd].values())

        # cull invalid values
        if temporal_dem_object[idd][0] is None or temporal_dem_object[idd][0] < 0:
            temporal_object[idd] = [0] * len(temporal_object[idd])
            temporal_bl_object[idd] = [0] * len(temporal_bl_object[idd])
            temporal_dem_object[idd] = [0] * len(temporal_dem_object[idd])
            temporal_dem_bl_object[idd] = [0] * len(temporal_dem_bl_object[idd])


    tot_areas = {}
    
    for f in new_fs:
        idd = f["properties"]["DU_ID"]

        if idd not in tot_areas:
            tot_areas[idd] = 0

        tot_areas[idd] += area.area(f["geometry"]) / 6e8

    avgsUnmetDemandBaseline = [RollingAvg() for _ in range(1200)]
    avgsUnmetDemand = [RollingAvg() for _ in range(1200)]
    avgsDifference = [RollingAvg() for _ in range(1200)]
    avgsDemandBaseline = [RollingAvg() for _ in range(1200)]
    avgsDemandDifference = [RollingAvg() for _ in range(1200)]
    avgsSupplyBaseline = [RollingAvg() for _ in range(1200)]
    avgsSupply = [RollingAvg() for _ in range(1200)]

    for f in new_fs:
        idd = f["properties"]["DU_ID"]
        rea = tot_areas[idd]
        for i in range(len(temporal_object[idd])):
            avgsUnmetDemandBaseline[i].add_to_avg(temporal_bl_object[idd][i], rea)
            avgsUnmetDemand[i].add_to_avg(temporal_object[idd][i], rea)
            avgsDifference[i].add_to_avg(temporal_object[idd][i] - temporal_bl_object[idd][i], rea)
            avgsDemandBaseline[i].add_to_avg(temporal_dem_bl_object[idd][i], rea)
            avgsDemandDifference[i].add_to_avg(temporal_dem_object[idd][i] - temporal_dem_bl_object[idd][i], rea)
            avgsSupplyBaseline[i].add_to_avg(temporal_supply_bl_object[idd][i], rea)
            avgsSupply[i].add_to_avg(temporal_supply_object[idd][i], rea)

    
    # with open("baseline_groundwater.json") as region_file:
    
    #     # Reading from json file
    #     region_object = ujson.load(region_file)

            
    #     new_fs = [f for f in region_object["features"] if f["properties"]["DU_ID"]]

    #     with open(f"groundwater_hex_{MMIN}_{MMAX}.json", "w") as outfile:

    #         hex_object = geojsonToHexPoints(region_object["features"], avgGroundwater, [MMIN, MMAX])

    #         ujson.dump(hex_object, outfile)

    with open("averages.csv", "w") as outfile:
        outfile.write(",".join(["averageUnmetDemandBaseline"] + [str(r.get_avg()) for r in avgsUnmetDemandBaseline]) + "\n")
        outfile.write(",".join(["averageUnmetDemand"] + [str(r.get_avg()) for r in avgsUnmetDemand]) + "\n")
        outfile.write(",".join(["averageDifference"] + [str(r.get_avg()) for r in avgsDifference]) + "\n")
        outfile.write(",".join(["averageDemandBaseline"] + [str(r.get_avg()) for r in avgsDemandBaseline]) + "\n")
        outfile.write(",".join(["averageDemandDifference"] + [str(r.get_avg()) for r in avgsDemandDifference]) + "\n")
        outfile.write(",".join(["averageSupplyBaseline"] + [str(r.get_avg()) for r in avgsSupplyBaseline]) + "\n")
        outfile.write(",".join(["averageSupply"] + [str(r.get_avg()) for r in avgsSupply]) + "\n")

    with open("averages.json", "w") as outfile:
        ujson.dump({
            "averageUnmetDemandBaseline": [r.get_avg() for r in avgsUnmetDemandBaseline],
            "averageUnmetDemand": [r.get_avg() for r in avgsUnmetDemand],
            "averageDifference": [r.get_avg() for r in avgsDifference],
            "averageDemandBaseline": [r.get_avg() for r in avgsDemandBaseline],
            "averageDemandDifference": [r.get_avg() for r in avgsDemandDifference],
            "averageSupplyBaseline": [r.get_avg() for r in avgsSupplyBaseline],
            "averageSupply": [r.get_avg() for r in avgsSupply]
        }, outfile)