from django import forms
from django.forms.extras.widgets import SelectDateWidget
GENE_CHOICES = ('LEF1', 'RANKL', 'PTHrP')

class GenotypeInputForm(forms.Form):
	genotype1=forms.CharField(required=True)
	trait1=forms.CharField(required=True)
	genotype2=forms.CharField(required=False)
	trait2=forms.CharField(required=False)
	genotype3=forms.CharField(required=False)
	trait3=forms.CharField(required=False)
	number_of_mice=forms.IntegerField(required=False)
	average_litter_size=forms.IntegerField(required=False)


