import json
from mice_db.models import Mouse
from django.db.models import Q

__author__ = 'user'

#The generation is determined as follows:
# Mice with no known parents (either blank id, or id not found within colony) are first generation.
# All children that result from a mating between mice from the first generation are in the
# second generation, regardless of multiple litters being produced over time.

class MiceGen:
	def __init__(self):
		self.mice = {}

	def exists(self, mId):
		return mId in self.mice.keys()

	def get_ids(self):
		return self.mice.keys()

	def add_mouse(self, mObj, genNum):
		self.mice[mObj.mouseId] = {
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
		"generation" : genNum }

# Check all mother and father ids in the database and set any ids that do not match
# a mouseId to the empty string value.
def clear_invalid_parents():
	allData = Mouse.objects.all()
	allMouseIds = [m["mouseId"] for m in Mouse.objects.values("mouseId")]
	for mouse in allData:
		if (mouse.motherId not in allMouseIds) or (mouse.fatherId not in allMouseIds):
			mouse.motherId = ''
			mouse.fatherId = ''
			mouse.save()

# Expect convention that the first generation parents are missing both parent ids
def find_first_gen(allMice):
	genQuery = Mouse.objects.all().filter( motherId="", fatherId="")
	for mouse in genQuery:
		allMice.add_mouse( mouse, 0)
	return [m.mouseId for m in genQuery]

# Only consider as part of next generation if both parents are in current generation
# or a previous generation. Otherwise, one parent is not born yet,and
# the mouse should belong to generation after the younger parent.
def checkLineage( m, currMice, allMice):
	if ( (m.motherId in currMice) or (allMice.exists(m.motherId)) ) and \
	   ( (m.fatherId in currMice) or (allMice.exists(m.fatherId)) ):
		return True
	else:
		return False

# Determine next gen by looking at father/mother info of mice.
# Parameters
# eligibleList: an array of mouseId's
# processedMice: an object of type MiceGen that is changed through recursive calls of this function
# genNum: the generation number that is being determined
def get_single_gen(eligibleList, processedMice, genNum):
	# Select mice who have at least one parent in eligibleList.
	genQuery = Mouse.objects.all().filter( Q(motherId__in=eligibleList) | Q(fatherId__in=eligibleList))
	if len(genQuery) == 0:
		return
	genData = filter( lambda m: checkLineage(m, eligibleList, processedMice), genQuery)
	# Add mice to processed collection with a generation number
	for mouse in genData:
		processedMice.add_mouse(mouse, genNum)
		# Update the database with generation value.
		mouse.generation = genNum
		mouse.save()
	# Tag the next generation.
	nextParents = [m.mouseId for m in genData]
	get_single_gen( nextParents, processedMice, genNum+1)

# Return a MiceGen object. This retrieves all mice data and adds an extra field for generation.
# Mice with invalid parent ids will not be retrieved.
def get_generations():
	allMice = MiceGen()
	find_first_gen(allMice)
	get_single_gen( allMice.get_ids(), allMice, 1)
	return allMice
