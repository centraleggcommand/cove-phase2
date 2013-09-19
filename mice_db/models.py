from django.db import models

# Create your models here.
# The path to this file needs to exist in the main settings.py
# and then running 'python manage.py syncdb' will create the tables

class Mouse(models.Model):
	mouseId = models.IntegerField(primary_key=True)
	colonyId = models.ForeignKey('Colony', blank=True, null=True, on_delete=models.SET_NULL)
	gender = models.CharField(max_length=1)
	litter = models.IntegerField(default=0)
	fatherId = models.IntegerField(default=0)
	motherId = models.IntegerField(default=0)
	dobMonth = models.IntegerField(default=0)
	dobDay = models.IntegerField(default=0)
	dobYear = models.IntegerField(default=0)
	dodMonth = models.IntegerField(default=0)
	dodDay = models.IntegerField(default=0)
	dodYear = models.IntegerField(default=0)
	tod = models.CharField(max_length=15)
	notes = models.TextField()
	gene1 = models.CharField(max_length=10)
	gene2 = models.CharField(max_length=10)
	gene3 = models.CharField(max_length=10)
	genotype1 = models.CharField(max_length=10)
	genotype2 = models.CharField(max_length=10)
	genotype3 = models.CharField(max_length=10)

class Colony(models.Model):
	colonyId = models.IntegerField(primary_key=True)
	createdDate = models.DateField(auto_now_add=True)

class Genotype(models.Model):
	name = models.CharField(max_length=10)
