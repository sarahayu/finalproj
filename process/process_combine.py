import urllib.request, ujson, shapely, h3
from functools import reduce
import math
from PIL import Image

MMIN = 5
MMAX = 6
RES = 100
ATTRS = [
    "UnmetDemandBaseline",
    "DemandBaseline",
    # "Difference",
    # "DemandDifference",
# ]
# SCEN_ATTRS = [
    "UnmetDemand",
    "Demand",
]
SCENS = [
    "bl_h000",
    "CS3_ALT3_2022med_L2020ADV",
    "LTO_BA_EXP1_2022MED",
]

# Opening JSON file
with open(f"groundwater_hex_{MMIN}_{MMAX}_{RES}.json") as water_file, \
    open(f"diff_unmet_hex_{MMIN}_{MMAX}_{RES}.json") as difference_scenario_file, \
    open(f"landuse_hex_{MMIN}_{MMAX}_{RES}.json") as landuse_file:
 
    # Reading from json file
    water_object = ujson.load(water_file)
    difference_scenario_object = ujson.load(difference_scenario_file)
    landuse_object = ujson.load(landuse_file)

    for res in water_object:
        water_res = water_object[res]
        if res in difference_scenario_object and res in landuse_object:
            diff_scen_res = difference_scenario_object[res]
            landuse_res = landuse_object[res]

            for hexId in water_res:
                if hexId in diff_scen_res:
                    for aatr in ATTRS:
                        water_res[hexId][aatr] = diff_scen_res[hexId][aatr]
                        water_res[hexId][aatr + "Average"] = diff_scen_res[hexId][aatr + "Average"]
                if hexId in landuse_res:
                    water_res[hexId]["LandUse"] = landuse_res[hexId]["LandUse"]
    
    
    with open(f"combine_hex_{MMIN}_{MMAX}_{RES}.json", "w") as outfile:
        ujson.dump(water_object, outfile)