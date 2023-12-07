import urllib.request, ujson, shapely, h3
from functools import reduce
import math
from PIL import Image

MMIN = 5
MMAX = 6
ATTRS = [
    "UnmetDemandBaseline",
    "UnmetDemand",
    "Difference",
    "DemandBaseline",
    # "DemandDifference",
    # "SupplyBaseline",
    # "Supply",
]

# Opening JSON file
with open(f"groundwater_hex_{MMIN}_{MMAX}.json") as water_file, \
    open(f"diff_unmet_hex_{MMIN}_{MMAX}.json") as difference_scenario_file, \
    open(f"landuse_hex_{MMIN}_{MMAX}.json") as landuse_file:
 
    # Reading from json file
    water_object = ujson.load(water_file)
    difference_scenario_object = ujson.load(difference_scenario_file)
    landuse_object = ujson.load(landuse_file)

    for i, water_res in enumerate(water_object):
        if i < len(difference_scenario_object):
            diff_scen_res = difference_scenario_object[i]
            landuse_res = landuse_object[i]

            for hexId in water_res:
                if hexId in diff_scen_res:
                    for aatr in ATTRS:
                        water_res[hexId][aatr] = diff_scen_res[hexId][aatr]
                        water_res[hexId][aatr + "Average"] = diff_scen_res[hexId][aatr + "Average"]
                if hexId in landuse_res:
                    water_res[hexId]["LandUse"] = landuse_res[hexId]["LandUse"]
    
    
    with open(f"combine_hex_{MMIN}_{MMAX}.json", "w") as outfile:
        ujson.dump(water_object, outfile)