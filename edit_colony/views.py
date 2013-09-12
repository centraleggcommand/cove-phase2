# Create your views here.
from django.shortcuts import render
from django.forms import ModelForm
from mice_db.models import Mouse

class MouseEditForm( ModelForm):
	class Meta:
		model = Mouse

def edit_mouse(request):
	if request.method == 'POST':
		# Bind POST data to form obj and associate with row in db
		dbEntry = Mouse.objects.get( request.POST["mouseId"] )
		form = MouseEditForm( request.POST, instance=dbEntry)
		if form.is_valid():
			#return HttpResponseRedirect('/edit_menu/')
			return HttpResponse("Validated form")
		else:
			#how to return errors
			return HttpResponse("Invalid form input")
	else:
		form = MouseEditForm()
	return render( request, 'edit_mouse.html', {
		'form': form,
	})
