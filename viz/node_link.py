import json
from mice_db.models import Mouse

# This module is to create the json structure expected by D3
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
	allMice = Mouse.objects.values("mouseId", "fatherId", "motherId", "gender")
	return lineage( rootId, allMice)

def get_json_lineage( rootId):
	return json.dumps( get_lineage( rootId) )

