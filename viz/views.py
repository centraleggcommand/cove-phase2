# Create your views here.
from django.shortcuts import render
from django import forms
import viz.node_link as nodelink
from django.core.exceptions import ObjectDoesNotExist
from mice_db.models import Mouse
from django.http import HttpResponse

class MouseEditFind(forms.Form):
    mouseId = forms.CharField(max_length=15)


def draw_lineage(request):
    #if request.method == "POST":
    #    if request.POST["mouseId"]:
    #        json_lineage = nodelink.get_json_lineage(request.POST["mouseId"])
    #        contextVars = {'json_lineage': json_lineage}
    #        return render(request, 'lineage_view.html', contextVars)
    ## Default response for form request
    #form = MouseEditFind()
    #contextVars = {'form': form}
    #return render(request, 'find_lineage.html', contextVars)

    if request.method == "GET":
        try:
            dbEntry = Mouse.objects.get( mouseId=request.GET["mouseId"])
            json_lineage = nodelink.get_json_lineage(request.GET["mouseId"])
            contextVars = {'json_lineage': json_lineage}
            return render(request, 'lineage_view.html', contextVars)
        except Mouse.DoesNotExist:
            return HttpResponse("The mouse ID was not found in the database")

def find_lineage(request):

    return render( request, 'find_lineage.html', {
        'iSrc':"/viz/lineage_view/",
    })
