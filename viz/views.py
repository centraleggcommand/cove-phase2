# Create your views here.
from django.shortcuts import render
from django import forms
import viz.data_retrieval as vizd
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
            json_lineage = vizd.get_json_lineage(request.GET["mouseId"])
            contextVars = {'json_lineage': json_lineage,
                           'iSrcEdit':"/edit_colony/edit_mouse/",
                           'curr_domain': request.get_host(),
            }
            return render(request, 'lineage_view.html', contextVars)
        except Mouse.DoesNotExist:
            return HttpResponse("The mouse ID was not found in the database")

def find_lineage(request):

    return render( request, 'find_lineage.html', {
        'iSrc':"/viz/lineage_view/",
    })

def draw_force(request):
    if request.method == "GET":
        # Need data of all mice in json format
        jsonAllMice = vizd.all_mice_gen()
        contextVars = {'jsonAllMice': jsonAllMice}
        return render(request, 'force_view.html', contextVars)

def draw_pack(request):
    if request.method == "GET":
        # Need data of all mice in json format
        jsonAllMice = vizd.all_mice_gen()
        contextVars = {'jsonAllMice': jsonAllMice,
					   'curr_domain': request.get_host()}
        return render(request, 'pack_view.html', contextVars)

def draw_colony(request):
    if request.method == "GET":
        # Need data of all mice in json format
        jsonAllMice = vizd.all_mice_gen()
        contextVars = {'jsonAllMice': jsonAllMice,
					   'curr_domain': request.get_host(),
                  'colonySelect': 'selected'}
        return render(request, 'colony.html', contextVars)

def draw_stats(request):
    if request.method == "GET":
        # Need data of all mice in json format
        jsonAllMice = vizd.all_mice_gen()
        contextVars = {'jsonAllMice': jsonAllMice,
					   'curr_domain': request.get_host(),
                  'statsSelect': 'selected'}
        return render(request, 'stats.html', contextVars)
