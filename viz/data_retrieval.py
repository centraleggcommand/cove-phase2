import json
import collections
from mice_db.models import Mouse

# The following functions are used to create the json structure expected by D3
# to support node-link diagrams.
# Assumes a table with unique mouseId and possible fatherId and motherId

# assign parents to each mouse
def find_dad( node, mice):
        for mouse in mice:
                if mouse["mouseId"] == node["fatherId"]:
                        return mouse
        return None

def find_mom( node, mice):
        for mouse in mice:
                if mouse["mouseId"] == node["motherId"]:
                        return mouse
        return None

# Try to modify node arg with added field of parent list.
# Note: very confusing that the field for parents is actually
# called "children". This is because D3 expects that default
# name for generating a cluster viz. Providing D3 with custom
# accessor fxn is tbd.
def bind_parent( node, mice):
        dad = find_dad( node, mice)
        mom = find_mom( node, mice)
        res = []
        if dad:
                res.append(dad)
        if mom:
                res.append(mom)
        if res:
                node['children'] = res

# Recurse through parents of each mouse
def lineage(nodeId, mice):
        node = {}
        # Find data for a mouse
        for mouse in mice:
                if mouse["mouseId"] == nodeId:
                        node = mouse
                        break
        if not node:
                return
        # Find parents and add as a list
        bind_parent( node, mice)
        if "children" in node.keys():
                # Examine father's parents
                if node["children"][0]:
                        lineage( node["children"][0]["mouseId"], mice)
                # Examine mother's parents
                if node["children"][1]:
                        lineage( node["children"][1]["mouseId"], mice)
        return node

def get_lineage( rootId):
        allMice = Mouse.objects.values("mouseId", "fatherId", "motherId", "gender","gene1","gene2","gene3",
                                       "genotype1", "genotype2", "genotype3", "generation")
        return lineage( rootId, allMice)

def get_json_lineage( rootId):
        return json.dumps( get_lineage( rootId) )

################################################
# The following functions support the force_view

def mouse_json(mObj):
    return {
    "mouseId" : mObj.mouseId,
    "gender" : mObj.gender,
    "litter" : mObj.litter,
    "fatherId" : mObj.fatherId,
    "motherId" : mObj.motherId,
    "gene1" : mObj.gene1,
    "gene2" : mObj.gene2,
    "gene3" : mObj.gene3,
    "genotype1" : mObj.genotype1,
    "genotype2" : mObj.genotype2,
    "genotype3" : mObj.genotype3,
    "generation" : mObj.generation }

def all_mice_gen():
    allMice = []
    genNum = 0
    genQuery = Mouse.objects.all().filter( generation=genNum)
    querySize = len(genQuery)
    while querySize > 0:
        allMice.append( [mouse_json(m) for m in genQuery])
        genNum += 1
        genQuery = Mouse.objects.all().filter( generation=genNum)
        querySize = len(genQuery)
    # Calculate number of children a mouse has spawned
    childCounter = collections.defaultdict(int)
    for gen in allMice:
        for mouse in gen:
            childCounter[mouse['fatherId']] += 1
            childCounter[mouse['motherId']] += 1
    # Save counts in each mouse
    for gen in allMice:
        for mouse in gen:
            mouse['numOffspring'] = childCounter[mouse['mouseId']]

    return json.dumps( allMice)