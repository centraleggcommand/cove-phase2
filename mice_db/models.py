from django.db import models

# Create your models here.
# The path to this file needs to exist in the main settings.py
# and then running 'python manage.py syncdb' will create the tables

class Mouse(models.Model):
	mouseId = models.CharField(max_length=15, primary_key=True)
	colonyId = models.ForeignKey('Colony', blank=True, null=True, on_delete=models.SET_NULL)
	generation = models.IntegerField(default=0)
	gender = models.CharField(max_length=5)
	litter = models.IntegerField(default=0)
	fatherId = models.CharField(max_length=15, blank=True)
	motherId = models.CharField(max_length=15, blank=True)
	dobMonth = models.IntegerField(null=True, blank=True)
	dobDay = models.IntegerField(null=True, blank=True)
	dobYear = models.IntegerField(null=True, blank=True)
	dodMonth = models.IntegerField(null=True, blank=True)
	dodDay = models.IntegerField(null=True, blank=True)
	dodYear = models.IntegerField(null=True, blank=True)
	tod = models.CharField(max_length=15, blank=True)
	notes = models.TextField(blank=True)
	gene1 = models.CharField(max_length=10)
	gene2 = models.CharField(max_length=10)
	gene3 = models.CharField(max_length=10)
	genotype1 = models.CharField(max_length=10)
	genotype2 = models.CharField(max_length=10)
	genotype3 = models.CharField(max_length=10)

	def __unicode__(self):
		return self.mouseId

class Colony(models.Model):
	colonyId = models.IntegerField(primary_key=True)
	createdDate = models.DateField(auto_now_add=True)

class Genotype(models.Model):
	name = models.CharField(max_length=10)
