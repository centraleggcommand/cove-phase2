from django.db import models
from django.forms import ModelForm


MALE = 'M'
FEMALE = 'F'
GENDER = (
	(MALE, 'M'),
	(FEMALE, 'F'),
	)
LEF1 =  'LEF1'
RANKL = 'RANKL'
PTHrP = 'PTHrP'
GENE_CHOICES = (
        (LEF1, 'LEF1'),
        (RANKL, 'RANKL'),
        (PTHrP, 'PTHrP'),
    )
GENOTYPE_ONE = '+/+'
GENOTYPE_TWO = '+/-'
GENOTYPE_THREE = '-/+'
GENOTYPE_FOUR = '-/-'
GENOTYPE_CHOICES = (
	(GENOTYPE_ONE, '+/+'),
	(GENOTYPE_TWO, '+/-'),
	(GENOTYPE_THREE, '-/+'),
	(GENOTYPE_FOUR, '-/-'),
	)


class BreedingCalculatorModel(models.Model):
	gene_one = models.CharField(max_length = 5, choices = GENE_CHOICES)
	genotype_one = models.CharField(max_length = 3, choices = GENOTYPE_CHOICES)
	gene_two = models.CharField(max_length = 5, choices = GENE_CHOICES)
	genotype_two = models.CharField(max_length = 3, choices = GENOTYPE_CHOICES)
	gene_three = models.CharField(max_length = 5, choices = GENE_CHOICES)
	genotype_three = models.CharField(max_length = 3, choices = GENOTYPE_CHOICES)
	target_gender = models.CharField(max_length = 1, choices = GENDER)
	average_litter_size = models.IntegerField()
	number_of_mice_required = models.IntegerField()
	percentage_of_gender_per_litter = models.IntegerField()



# Create your models here.