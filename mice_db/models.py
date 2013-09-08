from django.db import models

# Create your models here.

class Mouse(models.Model):
	mouseId = models.IntegerField(primary_key=True)
	colony = models.ForeignKey('Colony', blank=True, null=True, on_delete=models.SET_NULL)
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
	gene1 = models.CharField(max_length=4)
	gene2 = models.CharField(max_length=4)
	gene3 = models.CharField(max_length=4)

class Colony(models.Model):
	colonyId = models.IntegerField(primary_key=True)
	createdDate = models.DateField(auto_now_add=True)
