# Create your views here.
from django.shortcuts import render
from django.http import HttpResponse
from mice_db.models import Mouse
from breeding_calculator.forms import GenotypeInputForm

def determine_parent_genotype(cd):
	"""This parses the input genotype. For instance, if the input genotype is
	LEF+/- then that would be mapped to Aa****

	To get a mouse of this genotype, we require a parent of type A***** and a parent
	of type a*****

	required_parent_type_one stores the genotype of the the first parent and 
	required_parent_type_two stores the genotype of the second parent 	

	Thus, required_parent_type_one = [LEF1, +, RANKL, +, -, PHTrP, +, -] and 
	required_parent_type_two = [LEF1, -, RANKL, +, -, PHTrP, +, -]"""

	required_parent_type_one = []
	required_parent_type_two = []

	if cd['genotype1']:
		trait_one = [list(cd['trait1'])[0] + '/' + trait for trait in ['+','-']]
		trait_two = [trait +  '/' + list(cd['trait1'])[-1] for trait in ['+','-']]
	else:
		cd['genotype1'] = 'LEF1'
		trait_one = [trait for trait in ['+/+','+/-','-/-','-/+']]
		trait_two = [trait for trait in ['+/+','+/-','-/-','-/+']]
	required_parent_type_one.append((cd['genotype1'],trait_one))
	required_parent_type_two.append((cd['genotype1'],trait_two))


	if cd['genotype2']:
		trait_one = [list(cd['trait1'])[0] + '/' + trait for trait in ['+','-']]
		trait_two = [trait +  '/' + list(cd['trait1'])[-1] for trait in ['+','-']]
	else:
		cd['genotype2'] = 'RANKL'
		trait_one = [trait for trait in ['+/+','+/-','-/-','-/+']]
		trait_two = [trait for trait in ['+/+','+/-','-/-','-/+']]
	required_parent_type_one.append((cd['genotype2'],trait_one))
	required_parent_type_two.append((cd['genotype2'],trait_two))


	if cd['genotype3']:
		trait_one = [list(cd['trait1'])[0] + '/' + trait for trait in ['+','-']]
		trait_two = [trait +  '/' + list(cd['trait1'])[-1] for trait in ['+','-']]
	else:
		cd['genotype3'] = 'PTHrP'
		trait_one = [trait for trait in ['+/+','+/-','-/-','-/+']]
		trait_two = [trait for trait in ['+/+','+/-','-/-','-/+']]
	required_parent_type_one.append((cd['genotype3'], trait_one))
	required_parent_type_two.append((cd['genotype3'], trait_two))
	#print required_parent_type_one,required_parent_type_two
	return required_parent_type_one,required_parent_type_two

def retrieve_parents(required_parent_type_one,required_parent_type_two):
	""" This method retrieves the set of mice from the database which can be potential parents.

	We have two kinds of parents (type 1 and type 2), and a mouse of a given type can be male
	or female. Thus, for each given type, we get two sets of potential parents.

	LEF1 [u'-/+', u'-/-'] PTHrP ['+/+', '+/-', '-/-', '-/+'] RANKL [u'-/+', u'-/-']

	LEF1 [u'+/-', u'-/-'] PTHrP ['+/+', '+/-', '-/-', '-/+'] RANKL [u'+/-', u'-/-']

	Let required_parent_type_one = ['LEF1+', 'RANKL-', 'PTHrP-'] 
	and required_parent_type_two = ['LEF1-', 'RANKL-', 'PTHrP-']


	"""
	parent_one = []
	parent_two = []
	type_one = []
	type_two = []
	mothers_one = []
	mothers_two = []
	fathers_one = []
	fathers_two = []

	potential_mice = []
	for trait_LEFL1 in required_parent_type_one[0][1]:
		for trait_RANKL in required_parent_type_one[1][1]:
			for trait_PTHrP in required_parent_type_one[2][1]:
				parent_one.append((required_parent_type_one[0][0] + ':' + str(trait_LEFL1),required_parent_type_one[1][0] + ':' + str(trait_RANKL), required_parent_type_one[2][0] + ':' + str(trait_PTHrP)))

	for trait_LEFL1 in required_parent_type_two[0][1]:
		for trait_RANKL in required_parent_type_two[1][1]:
			for trait_PTHrP in required_parent_type_two[2][1]:
				parent_two.append((required_parent_type_two[0][0] + ':' + str(trait_LEFL1),required_parent_type_two[1][0] + ':' + str(trait_RANKL),required_parent_type_two[2][0] + ':' + str(trait_PTHrP)))

	mice = []
	for mouse in parent_one:
		m = Mouse.objects.filter(genotype1=mouse[0].split(':')[1]).filter(genotype2=mouse[1].split(':')[1]).filter(genotype3=mouse[2].split(':')[1])
		if m:
			type_one.append((mouse, m))
	mice=[]
	for mouse in parent_two:
		m = Mouse.objects.filter(genotype1=mouse[0].split(':')[1]).filter(genotype2=mouse[1].split(':')[1]).filter(genotype3=mouse[2].split(':')[1])
		if m:
			type_two.append((mouse,m))

	for mice in type_one:
		for mouse in mice[1].values('gender','mouseId'):
			if mouse['gender'] == 'M':
				fathers_one.append((mice[0],mouse['mouseId']))
			else:
				mothers_one.append((mice[0],mouse['mouseId']))

	for mice in type_two:
		for mouse in mice[1].values('gender','mouseId'):
			if mouse['gender'] == 'M':
				fathers_two.append((mice[0],mouse['mouseId']))
			else:
				mothers_two.append((mice[0],mouse['mouseId']))


	#print fathers_one,"\n\n",mothers_one,"\n\n",fathers_two,"\n\n",mothers_two
	return fathers_one,mothers_one,fathers_two,mothers_two

	

def breeding_calculator(f1,m1,f2,m2,cd):
	print f1,"\n\n",m1
	for father in f1:
		for mother in m1:

	pass

def compute_ancestors(request):
	errors=[]
	if request.method == 'POST':
		form = GenotypeInputForm(request.POST)
		if form.is_valid():
			required_parent_type_one = []
			required_parent_type_two = []
			cd = form.cleaned_data
			required_parent_type_one, required_parent_type_two = determine_parent_genotype(cd)
			f1,m1,f2,m2 = retrieve_parents(required_parent_type_one,required_parent_type_two)
			breeding_calculator(f1,m1,f2,m2,cd)

			
			return render(request, 'potential_parents.html', {'p1': required_parent_type_one, 'p2': required_parent_type_two})
	else:
		form=GenotypeInputForm
		return render(request, 'determine_parents.html', {'form': form})

def calculate(request):
	if request.method == 'GET':
		return render(request, 'determine_parents.html')



