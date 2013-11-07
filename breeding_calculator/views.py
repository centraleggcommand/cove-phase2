# Create your views here.
from django.shortcuts import render
from django.http import HttpResponse
from mice_db.models import Mouse
from breeding_calculator.forms import GenotypeInputForm

def determine_parent_genotype(cd):
	"""This parses the input genotype. For instance, if the input genotype is
	LEF+/-, RANKL -/-, PHTrP +/-, then that would be mapped to AabbCc. 

	To get a mouse of this genotype, we require a parent of type A*b*C* and a parent
	of type a*b*c*

	required_parent_type_one stores the genotype of the the first parent and 
	required_parent_type_two stores the genotype of teh second parent 	

	Thus, required_parent_type_one = [LEF1, +, RANKL, -, PHTrP, +] and 
	required_parent_type_two = [LEF1, -, RANKL, -, PHTrP, -]"""

	required_parent_type_one = []
	required_parent_type_two = []

	"""list(trait1) = [+,/,-]"""

	required_parent_type_one.append(cd['genotype1']+list(cd['trait1'])[0])
	required_parent_type_two.append(cd['genotype1']+list(cd['trait1'])[-1])

	if cd['genotype2']:
		required_parent_type_one.append(cd['genotype2']+list(cd['trait2'])[0])
		required_parent_type_two.append(cd['genotype2']+list(cd['trait2'])[-1])
	if cd['genotype3']:
		required_parent_type_one.append(cd['genotype3']+list(cd['trait3'])[0])
		required_parent_type_two.append(cd['genotype3']+list(cd['trait3'])[-1])
	return required_parent_type_one,required_parent_type_two

def retrieve_parents(required_parent_type_one,required_parent_type_two):
	""" This method retrieves the set of mice from the database which can be potential_mothers
	parents.

	We have two kinds of parents, and 
	"""
	potential_mothers_type_one = []
	potential_mothers_type_two = []
	potential_fathers_type_one = []
	potential_fathers_type_two = []	
	for gene in required_parent_type_one:






def compute_ancestors(request):
	errors=[]
	if request.method == 'POST':
		form=GenotypeInputForm(request.POST)
		if form.is_valid():
			required_parent_type_one=[]
			required_parent_type_two=[]
			cd = form.cleaned_data
			required_parent_type_one, required_parent_type_two = determine_parent_genotype(cd)
			#potential_mothers,potential_fathers = retrieve_parents(required_parent_type_one,required_parent_type_two)
			mouse = Mouse.objects.filter(gene1=cd['genotype1']).filter(genotype1=cd['trait1'])
			return render(request, 'potential_parents.html', {'p1': required_parent_type_one, 'p2': required_parent_type_two})
	else:
		form=GenotypeInputForm
		return render(request, 'determine_parents.html', {'form': form})

def calculate(request):
	if request.method == 'GET':
		return render(request, 'determine_parents.html')



