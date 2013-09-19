# Create your views here.
import simplejson as json
from django.http import HttpResponse
from django.shortcuts import render
from django import forms
from mice_db.models import Mouse, Genotype

class MouseEditFind( forms.Form):
	mouseId = forms.CharField(max_length=15)

class MouseEditForm( forms.ModelForm):
	class Meta:
		model = Mouse

def add_mouse(request):
	if request.method == 'POST':
		# Bind POST data to form obj and associate with row in db
		if request.POST["mouseId"]:
			try:
				dbEntry = Mouse.objects.get( mouseId=request.POST["mouseId"] )
				form = MouseEditForm( request.POST, instance=dbEntry)
				form.genotype1 = request.POST['genotype1']
				form.genotype2 = request.POST['genotype2']
				form.genotype3 = request.POST['genotype3']
				if form.is_valid():
					#return HttpResponseRedirect('/edit_menu/')
					form.save()
					return HttpResponse("Saved mouse data")
				else:
					# Return form with error messages
					return render( request, 'add_mouse.html', {
						'form': form,
						})
			except DoesNotExist:
				form = MouseEditForm( request.POST)
				form.errors['mouseId'] = \
				"MouseId does not match an existing mouse"
				return render( request, 'add_mouse.html', {
					'form': form,
					})
	# Default response for form request
	form = MouseEditForm()
	# Supply list of used genotypes
	#gTypes = json.dumps( ["LEF1", "RANKL", "PTHrP"] )
	gTypes = []
	for t in Genotype.objects.all():
		gTypes.append(t.name)
	#gTypes = json.dumps( gTypes)
	return render( request, 'add_mouse.html', {
		'form': form,
		'geneList': gTypes,
		'submitAction': '/edit_colony/add_mouse/',
		'header': 'Mouse IDs must be unique',
		})

def edit_mouse(request):
	if request.method == 'POST':
		# Bind POST data to form obj and associate with row in db
		if request.POST["mouseId"]:
			try:
				dbEntry = Mouse.objects.get( mouseId=request.POST["mouseId"] )
				form = MouseEditForm( request.POST, instance=dbEntry)
				form.genotype1 = request.POST['genotype1']
				form.genotype2 = request.POST['genotype2']
				form.genotype3 = request.POST['genotype3']
				if form.is_valid():
					#return HttpResponseRedirect('/edit_menu/')
					form.save()
					return HttpResponse("Saved mouse data")
				else:
					# Return form with error messages
					return render( request, 'edit_mouse.html', {
						'form': form,
						})
			except DoesNotExist:
				form = MouseEditForm( request.POST)
				form.errors['mouseId'] = \
				"MouseId does not match an existing mouse"
				return render( request, 'edit_mouse.html', {
					'form': form,
					})
	# Default response for form request
	form = MouseEditForm()
	# Supply list of used genotypes
	#gTypes = json.dumps( ["LEF1", "RANKL", "PTHrP"] )
	gTypes = []
	for t in Genotype.objects.all():
		gTypes.append(t.name)
	gTypes = json.dumps( gTypes)
	return render( request, 'edit_mouse.html', {
		'form': form,
		'geneList': gTypes,
		'submitAction': '/edit_colony/edit_mouse/',
		'header': 'Enter a mouse ID',
		})

def find_mouse(request):
	if request.method == 'POST':
		# Bind POST data to form obj and associate with row in db
		if request.POST["mouseId"]:
			try:
				dbEntry = Mouse.objects.get( mouseId=request.POST["mouseId"] )
				form = MouseEditForm( instance=dbEntry)
				return render( request, 'edit_mouse.html', {
						'form': form,
						'submitAction': '/edit_colony/edit_mouse/',
						'header': 'Enter a mouse ID',
						})
			except DoesNotExist:
				form = MouseEditFind()
				form.errors['mouseId'] = "The mouse ID was not valid"
				return render( request, 'find_mouse.html', {
					'form': form,
					})
		else:
			form = MouseEditFind()
			form.errors['mouseId'] = "A mouse ID is required"
			return render( request, 'find_mouse.html', {
				'form': form,
				})
	# Default
	form = MouseEditFind()
	return render( request, 'find_mouse.html', {
		'form': form,
		})
