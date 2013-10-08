# Create your views here.
import json
from django.http import HttpResponse
from django.shortcuts import render
from django import forms
from django.core.exceptions import ObjectDoesNotExist
from mice_db.models import Mouse, Genotype

class MouseEditForm( forms.ModelForm):
	class Meta:
		model = Mouse
		widgets = {
			'notes': forms.Textarea(attrs={'cols': 80, 'rows': 5}),
			'gene1': forms.Select(attrs={'class': "easyui-combobox",
						'name':"gene1"}),
			'gene2': forms.Select(attrs={'class': "easyui-combobox",
						'name':"gene2"}),
			'gene3': forms.Select(attrs={'class': "easyui-combobox",
						'name':"gene3"}),
			'genotype1': forms.RadioSelect(
						choices=[("+/-", "+/-"), ("-/-", "-/-"),
								("WT", "+/+(WT)"), ("NA", "NA")]),
			'genotype2': forms.RadioSelect(
						choices=[("+/-", "+/-"), ("-/-", "-/-"),
								("WT", "+/+(WT)"), ("NA", "NA")]),
			'genotype3': forms.RadioSelect(
						choices=[("+/-", "+/-"), ("-/-", "-/-"),
								("WT", "+/+(WT)"), ("NA", "NA")]),
		}

def mouse_context( gene1Val='',
				   gene2Val='',
				   gene3Val='',
					submitAction='/edit_colony/add_mouse/',
					header='Mouse ID must be unique'):
	allVars = {}
	gTypes = []
	for t in Genotype.objects.all():
		gTypes.append(t.name)
	allVars['geneList'] = gTypes
	allVars['gene1Val'] = gene1Val
	allVars['gene2Val'] = gene2Val
	allVars['gene3Val'] = gene3Val
	allVars['submitAction'] = submitAction
	allVars['header'] = header
	return allVars

def add_mouse(request):
	if request.method == 'POST':
		# Bind POST data to form obj and associate with row in db
		if request.POST["mouseId"]:
			try:
				dbEntry = Mouse.objects.get( mouseId=request.POST["mouseId"] )
				# This mouseId is already in use - send error
				form = MouseEditForm( request.POST)
				form.errors['mouseId'] = \
				"Mouse ID already in use - enter a new ID"
				contextVars = mouse_context()
				contextVars['form'] = form
				return render( request, 'add_mouse.html', contextVars)
			except Mouse.DoesNotExist:
				form = MouseEditForm( request.POST)
				if form.is_valid():
					form.save()
					return HttpResponse("Saved mouse data")
				else:
					return HttpResponse("Form did not validate")
	# Default response for form request
	form = MouseEditForm()
	# Supply list of used genotypes
	contextVars = mouse_context()
	contextVars['form'] = form
	return render( request, 'add_mouse.html', contextVars)

def edit_mouse(request):
	if request.method == 'POST':
		# Bind POST data to form obj and associate with row in db
		if request.POST["mouseId"]:
			try:
				dbEntry = Mouse.objects.get( mouseId=request.POST["mouseId"] )
				form = MouseEditForm( request.POST, instance=dbEntry)
				if form.is_valid():
					form.save()
					return HttpResponse("Saved mouse data")
				else:
					# Return form with error messages
					contextVars = mouse_context()
					contextVars['form'] = form
					return render( request, 'edit_mouse.html', contextVars)
			except Mouse.DoesNotExist:
				form = MouseEditForm( request.POST)
				form.errors['mouseId'] = \
				"MouseId does not match an existing mouse"
				contextVars = mouse_context()
				contextVars['form'] = form
				return render( request, 'edit_mouse.html', contextVars)
	elif request.method == 'GET':
		mId = request.GET["mouseId"]
		try:
			dbEntry = Mouse.objects.get( mouseId=mId )
			form = MouseEditForm( instance=dbEntry)
			contextVars = mouse_context(
							gene1Val=dbEntry.gene1,
							gene2Val=dbEntry.gene2,
							gene3Val=dbEntry.gene3,
							submitAction='/edit_colony/edit_mouse/',
							header='Edit mouse')
			contextVars['form'] = form
			return render( request, 'edit_mouse.html', contextVars)
		except Mouse.DoesNotExist:
			return HttpResponse("The mouse ID was not found in the database")
	# Default response for form request
	form = MouseEditForm()
	# Supply list of used genotypes
	contextVars = mouse_context(submitAction='/edit_colony/edit_mouse/',
								header='Enter a mouse ID')
	contextVars['form'] = form
	return render( request, 'edit_mouse.html', contextVars)

def find_edit(request):
#       if request.method == 'POST':
#   		# Bind POST data to form obj and associate with row in db
#   		if request.POST["mouseId"]:
#   			try:
#   				dbEntry = Mouse.objects.get( mouseId=request.POST["mouseId"] )
#   				form = MouseEditForm( instance=dbEntry)
#   				contextVars = mouse_context(
#   								submitAction='/edit_colony/edit_mouse/',
#   								header='Edit mouse')
#   				contextVars['form'] = form
#   				return render( request, 'edit_mouse.html', contextVars)
#   			except Mouse.DoesNotExist:
#   				form = MouseEditFind()
#   				form.errors['mouseId'] = "The mouse ID was not valid"
#   				return render( request, 'find_mouse.html', {
#   					'form': form,
#   					})
#   		else:
#   			form = MouseEditFind()
#   			form.errors['mouseId'] = "A mouse ID is required"
#   			return render( request, 'find_mouse.html', {
#   				'form': form,
#   				})
	# Default
	return render( request, 'find_edit.html', {
		'iSrc':"/edit_colony/edit_mouse/",
	})
