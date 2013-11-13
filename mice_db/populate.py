import csv
from mice_db.models import Mouse, Colony
import os

# This function will read the csv file given as parameter
# and then load the database specified by the Django project.

# Precondition:
# Run "python manage.py syncdb" with mice_db app included in settings.py
# USAGE:
# From within mice_db dir, run "python ../manage.py shell"
# Within interactive shell, run "from mice_db import populate"
# Within interactive shell, run "populate.upload_csv(['/mice_db/colonyC_ext'])

def upload_csv( fileName):
	curpath = os.path.abspath(os.curdir)
	with open(fileName) as csvfile:
		mouseReader = csv.reader( csvfile)
		# Obtain header with column names
		columns = mouseReader.next()
		# Create easy lookup of column name and array index
		columnPos = {}
		i = 0
		for c in columns:
			columnPos[c] = i
			i += 1
		for row in mouseReader:
			mouse = Mouse( \
					mouseId=row[columnPos['mouseId']],\
					gender=row[columnPos['gender']],\
					litter=row[columnPos['litter']],\
					fatherId=row[columnPos['fatherId']],\
					motherId=row[columnPos['motherId']],\
					dobMonth=row[columnPos['dobMonth']],\
					dobDay=row[columnPos['dobDay']],\
					dobYear=row[columnPos['dobYear']],\
					dodMonth=row[columnPos['dodMonth']],\
					dodDay=row[columnPos['dodDay']],\
					dodYear=row[columnPos['dodYear']],\
					tod=row[columnPos['tod']],\
					notes=row[columnPos['notes']],\
					gene1=row[columnPos['gene1']],\
					gene2=row[columnPos['gene2']],\
					gene3=row[columnPos['gene3']],\
					genotype1=row[columnPos['genotype1']],\
					genotype2=row[columnPos['genotype2']],\
					genotype3=row[columnPos['genotype3']]\
					)
			mouse.save()
