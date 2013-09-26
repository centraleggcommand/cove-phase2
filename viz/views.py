# Create your views here.
from django.shortcuts import render
from django import forms
import viz.node_link as nodelink


class MouseEditFind( forms.Form):
    mouseId = forms.CharField(max_length=15)

def draw_lineage( request):
	if request.method == "POST":
		if request.POST["mouseId"]:
			json_lineage = nodelink.get_json_lineage(request.POST["mouseId"])
			f = open('test.log','w')
			f.write('json_lineage: ')
			f.write(json_lineage)
			f.close()
			#contextVars = {'json_lineage' : json_lineage}
			#contextVars = {'lineage' : '{"fatherId": 100, "motherId": 101, "children": [{"fatherId": 50, "motherId": 51, "mouseId": 100}, {"fatherId": 50, "motherId": 52, "mouseId": 101}], "mouseId": 200}'}
			return render( request, 'parent_view.html', 
				{'json_lineage': json_lineage})
	# Default response for form request
	form = MouseEditFind()
	contextVars = {'form' : form}
	return render( request, 'find_mouse_lineage.html', contextVars)
