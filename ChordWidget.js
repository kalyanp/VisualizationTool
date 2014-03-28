(function ($) {
	var orgNames=["FPI","Hizbul","Indonesia Org"];
	matrixTable=[
		[190,0,	120,0,	0,	0],
		[0, 280,0,	0,	0,	9],
		[0,	40,	165,0,	0,	0],
		[0,	0,	0,	564,0,	9],
		[0,	0,	0,	0,	323,0],
		[0,	0,	0,	9,	0,	489]
    ];
	
	csv_data=[];
	d3.csv("widgets/org_sources.csv", function(loadedRows) {
		loadedRows.map(function(d) {
				var temp=[];
				temp[0]=d.Name;
				temp[1]=Number(d.Count);				
			if ($.inArray(d.Name, temp2) === -1) {
				csv_data.push(temp);
				temp2.push(d.Name);
			}
		});
		csv_data.sort(function(a, b) { return (a[1] < b[1] ? -1 : (a[1] > b[1] ? 1 : 0)); });
		temp3=[];
		$.each (csv_data, function(k, v) {
			temp3.push(v[0]);						
		});
	});
	
AjaxSolr.ChordWidget = AjaxSolr.AbstractWidget.extend({
  start: 0,

  beforeRequest: function () {
    $(this.target).html($('<img/>').attr('src', 'images/ajax-loader.gif'));
},

facetLinks: function (facet_field, facet_values) {
    var links = [];
    if (facet_values) {
      for (var i = 0, l = facet_values.length; i < l; i++) {
        if (facet_values[i] !== undefined) {
          links.push(AjaxSolr.theme('facet_link', facet_values[i], this.facetHandler(facet_field, facet_values[i])));
        }
        else {
          links.push(AjaxSolr.theme('no_items_found'));
        }
      }
    }
    return links;
  },

  facetHandler: function (facet_field, facet_value) {
    var self = this;
    return function () {
    	//alert("yo");
      self.manager.store.remove('fq');
      self.manager.store.addByValue('fq', facet_field + ':' + AjaxSolr.Parameter.escapeValue(facet_value));
      self.doRequest();
      return false;
    };
}

afterRequest: function () {
	  $(this.target).empty();
	  //The following is the code to redraw a chord diagram when polygon selection is done
	if(polygon_flag == true){
		var l = this.manager.response.response.docs.length;
		var polyUniqueOrgs = [];
		var polyUniqueOrgsMatrix = [];
		var dupIds = [];
		
		for(var i=0;i<l;i++){
			var doc = this.manager.response.response.docs[i];
			if($.inArray($.trim(doc.geoFromOrg),polyUniqueOrgs)== -1)
				polyUniqueOrgs.push($.trim(doc.geoFromOrg));
				
			if($.inArray($.trim(doc.geoToOrg),polyUniqueOrgs)== -1)
				polyUniqueOrgs.push($.trim(doc.geoToOrg));
		}
		
		polyUniqueOrgsMatrix = Create2DArray(polyUniqueOrgs.length);
		
		for(var i=0;i<l;i++){
			var doc = this.manager.response.response.docs[i];
			var rowIndex = $.inArray($.trim(doc.geoFromOrg),polyUniqueOrgs);
			var colIndex = $.inArray($.trim(doc.geoToOrg),polyUniqueOrgs);
			var concatValue=$.trim(doc.geoFromOrg)+"XX"+$.trim(doc.geoToOrg)+"XX"+doc.geoUserId1;
			if(doc.geoUserId1 && ($.inArray(concatValue,dupIds)==-1)){
				polyUniqueOrgsMatrix[rowIndex][colIndex] += 1;
				dupIds.push(concatValue);
			}
		}
		
		chord = d3.layout.chord()
					.padding(.05)
					.sortSubgroups(d3.descending)
					.matrix(polyUniqueOrgsMatrix);
		
		var	width = 490,
		height = 550,
		innerRadius = Math.min(width, height) * .31,
		outerRadius = innerRadius * 1.1;
			
		var fill = d3.scale.ordinal()
			.domain(d3.range(0))	
			.range([ "#1f77b4", "#aec7e8", "#98df8a", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5" ]);
		
		svg = d3.select("#chart")
				.append("svg")
				.attr("width", width)
				.attr("height", height)
				.append("g")
				.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
		
		var grp=svg.append("g")
					.selectAll("path")
					.data(chord.groups)
					.enter()
					.append("path")
					.style("fill", function(d) { return fill(d.index); })
					.style("stroke", function(d) { return fill(d.index); })
					.attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
					.on("click",function(d) {
						selectedChordOrg="noChord";
						chr.style("fill", function(d) { return fill(d.source.index); })
						.style("stroke", function(d) { return fill(d.source.index); });
						clickedOrg=polyUniqueOrgs[d.index];
						if(selectedOrg==clickedOrg){
							selectedOrg="noOrg";
							$("#center").text("Selected Org: "+selectedOrg);
			$("#right").text("Selected Chord: "+selectedChordOrg);//selectedSecondOrg="noOrg";
							callManager3();
							callManager6();
							callManagerUserTags();
							callManagerHashTags();
							callManagerKeywordTags();
							fade2(1);
							grp.style("fill", function(d) { return fill(d.index); })
							.style("stroke", function(d) { return fill(d.index); });
						}
						else if(selectedOrg!=clickedOrg && selectedOrg=="noOrg" ){
							selectedOrg=clickedOrg;
							$("#center").text("Selected Org: "+selectedOrg);
			$("#right").text("Selected Chord: "+selectedChordOrg);//selectedSecondOrg=clickedOrg;
							callManager3();
							callManager6();
							callManagerUserTags();
							callManagerHashTags();
							callManagerKeywordTags();
							fade2(1);
							fade1(d.index,.1);
							d3.select(this).style("fill", "black").style("stroke", "black");
						}
						else if(selectedOrg!=clickedOrg && selectedOrg!="noOrg" ){
							selectedOrg=clickedOrg;
							$("#center").text("Selected Org: "+selectedOrg);
			$("#right").text("Selected Chord: "+selectedChordOrg);//selectedSecondOrg=clickedOrg;
							callManager3();
							callManager6();
							callManagerUserTags();
							callManagerHashTags();
							callManagerKeywordTags();
							fade2(1);
							fade1(d.index,.1);
							grp.style("fill", function(d) { return fill(d.index); })
							.style("stroke", function(d) { return fill(d.index); });
							d3.select(this).style("fill", "black").style("stroke", "black");
						}     
					});
		
		var chr=svg.append("g")
					.attr("class", "chord")
					.selectAll("path")
					.data(chord.chords)
					.enter().append("path")
					.style("fill", function(d) { return fill(d.source.index); })
					.style("stroke", function(d) { return fill(d.source.index); })
					.attr("d", d3.svg.chord().radius(innerRadius))
					.style("opacity", 1);
		
		chr.append("title").text(
			function(d) { 
				return "From: " + polyUniqueOrgs[d.source.index] + "\nTo: "
						+ polyUniqueOrgs[d.target.index] + "\nMigrators: "
						+ polyUniqueOrgsMatrix[d.source.index][d.target.index];
			});

		var ticks = svg.append("g")
					  .selectAll("g")
					  .data(chord.groups)
					  .enter().append("g")
					  .selectAll("g")
					  .data(groupTicks_poly)
					  .enter().append("g")
					  .attr("transform", function(d) {
								return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
								 + "translate(" + outerRadius + ",0)";
							});
	
		ticks.append("line")
			.attr("x1", 1)
			.attr("y1", 0)
			.attr("x2", 0)
			.attr("y2", 0)
			.style("stroke", "#000");

		ticks.append("text")
			.attr("x", 0)
			.attr("dy", ".35em")
			.style("font-weight", "bold")
			.style("font-size",14)
			.style("fill", function(d) {
			  return d.color;
			})
			.attr("text-anchor", function(d) {
				return d.angle > Math.PI ? "end" : null;
			})
			.attr("transform", function(d) {
				return d.angle > Math.PI ? "rotate(180)translate(-16)" : null;
			})
			.text(function(d) { return d.label; });		

		function groupTicks_poly(d) {
			var k = (d.endAngle - d.startAngle) / d.value;
			return d3.range(0, d.value, 500).map(function(v, i) {
				var colorsList = clr();
				var orgName1 = polyUniqueOrgs[d.index];
				return {
					angle : (d.startAngle + d.endAngle) / 2,
					color : colorsList[d.index],// "#0000FF",
					label : orgName1
				};
			});
		}
		
		function clr(){
			var ar=[];
			var numchord =polyUniqueOrgs.length;
			if(numchord%2==1)
				numchord++;
			var freq=120/numchord;
			for(var i=0;i<=numchord/2;i++){
				ar[i]=hsvToRgb(120,100,(100-(freq*i)));
			}
			for(var i=numchord/2;i<=numchord;i++){
				ar[i]=hsvToRgb(0,100,((freq*i)));
			}
			return ar;
		}
		
		
		//******************* For Chord *********************************
	
	chr
	.on("click",function(d) {
		selectedOrg="noOrg";
		grp.style("fill", function(d) { return fill(d.index); })
    	.style("stroke", function(d) { return fill(d.index); });
        clickedChordOrg=polyUniqueOrgs[d.source.index]+'#'+polyUniqueOrgs[d.target.index];        
        if(selectedChordOrg==clickedChordOrg){
        	selectedChordOrg="noChord";
			$("#center").text("Selected Org: "+selectedOrg);
			$("#right").text("Selected Chord: "+selectedChordOrg);//resetVariables();			
        	//New functions
			callManagerHashTags();
			callManagerUserTags();
			callManagerKeywordTags();
			callManager3();
			callManager4();
			callManager6();
        	chr.style("fill", function(d) { return fill(d.source.index); })
	    	.style("stroke", function(d) { return fill(d.source.index); });
			fade2(1);			
    	}
    	else if(selectedChordOrg!=clickedChordOrg && selectedChordOrg=="noChord" ){
    		selectedChordOrg=clickedChordOrg;
			$("#center").text("Selected Org: "+selectedOrg);
			$("#right").text("Selected Chord: "+selectedChordOrg);//resetVariables();			
        	//New functions
			callManagerHashTags();
			callManagerUserTags();
			callManagerKeywordTags();
			callManager3();
			callManager4();
			callManager6();
    		d3.select(this).style("fill", "black").style("stroke", "black");
    	}
    	else if(selectedChordOrg!=clickedChordOrg && selectedChordOrg!="noChord" ){
    		selectedChordOrg=clickedChordOrg;
			$("#right").text("selected chord: "+selectedChordOrg);
        	//New functions
			callManagerHashTags();
			callManagerUserTags();
			callManagerKeywordTags();
			callManager3();
			callManager4();
			callManager6();
        	chr.style("fill", function(d) { return fill(d.source.index); })
	    	.style("stroke", function(d) { return fill(d.source.index); });
    		d3.select(this).style("fill", "black").style("stroke", "black");
    	}    
    });
	
	//********* End of chord testing ***********************************
		
	return;
	}	 
		
	//End of redraw chord on polygon selection
	  
	  var listofOrgs=[];
	  for (var facet in this.manager.response.facet_counts.facet_fields[this.field[0]]) {
			listofOrgs.push($.trim(facet));//adding fromOrg details
	  }
	  for (var facet in this.manager.response.facet_counts.facet_fields[this.field[1]]) {
			listofOrgs.push($.trim(facet));//adding toOrg details
	  } 
	  $.each(listofOrgs, function(i, el){
	      if($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
	  });
	  $.each (uniqueNames, function(k, v) {
			var temp=[];
			temp[0]=v;
			temp[1]=Number(0);
			csv_data1.push(temp);						
		});
		csv_data1=[]; 
		for(var v in uniqueNames){
			var temp=[];
			temp[0]=uniqueNames[v];
			temp[1]=temp3.indexOf(uniqueNames[v]);
			csv_data1.push(temp);	//console.log("t: "+temp[0]+" , "+temp[1]);		
		}
		csv_data1.sort(function(a, b) { return (a[1] < b[1] ? -1 : (a[1] > b[1] ? 1 : 0)); });
		temp4=[];
		$.each (csv_data1, function(k, v) {
			temp4.push(v[0]);	//console.log("v "+v[0]);					
		});
		uniqueNames=temp4;	
		orgNames=uniqueNames; 

	  //console.log(uniqueNames);
	  orgArray=Create2DArray(uniqueNames.length);
	  var row=0;
	  var col=0;
	  for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
	      var doc = this.manager.response.response.docs[i];
	      row=$.inArray($.trim(doc.fromOrg), uniqueNames);
	      col=$.inArray($.trim(doc.toOrg), uniqueNames);
	      orgArray[row][col]=orgArray[row][col]+doc.userIdCount;
	  }
	
	  $.each(orgArray, function(index, value) {
		  $.each(value, function(index1, value1) {
		        if(value1<3)
		        	orgArray[index][index1]=0;
			});
	});
	
	copy_orgNames = orgNames;	
	matrixTable=orgArray;
	
	
	var chord = d3.layout.chord()
    .padding(.05)
    .sortSubgroups(d3.descending)
    .matrix(matrixTable);

	
	var	width = 490,
    height = 550,
	innerRadius = Math.min(width, height) * .31,
    outerRadius = innerRadius * 1.1;
		
	var fill = d3.scale.ordinal()
	    .domain(d3.range(0))	
	    .range([ "#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5" ]);
	
	svg = d3.select("#chart")
	  .append("svg")
	    .attr("width", width)
	    .attr("height", height)
	  .append("g")
	    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
	
	var grp=svg.append("g")
	  .selectAll("path")
	    .data(chord.groups)
	  .enter()
		//.append("title").text("ggdd")
		.append("path")
	    .style("fill", function(d) { return fill(d.index); })
	    .style("stroke", function(d) { return fill(d.index); })
	    .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
	    //.on("mouseover", fade(.1))
	    //.on("mouseout", fade(1))
	    .on("click",function(d) { //console.log("in click  "+d.index);
	    	selectedChordOrg="noChord";
	    	chr.style("fill", function(d) { return fill(d.source.index); })
	    	.style("stroke", function(d) { return fill(d.source.index); });
	        //alert("IN "+orgNames[d.index]);
	    	clickedOrg=orgNames[d.index];
        	if(selectedOrg==clickedOrg){
        		selectedOrg="noOrg";
				$("#center").text("Selected Org: "+selectedOrg);
			$("#right").text("Selected Chord: "+selectedChordOrg);//resetVariables();
        		//New functions
				callManagerHashTags();
				callManagerUserTags();
				callManagerKeywordTags();
				//callManagerRadicalTags();
				//callManagerCounterRadicalTags();
				//End of New functions
				callManager3();
				callManager4();
				callManager6();
				fade2(1);console.log("I am in 1");
	    		grp.style("fill", function(d) { return fill(d.index); })
		    	.style("stroke", function(d) { return fill(d.index); });
	    	}
        	else if(selectedOrg!=clickedOrg && selectedOrg=="noOrg" ){
        		selectedOrg=clickedOrg;
				$("#center").text("Selected Org: "+selectedOrg);
			$("#right").text("Selected Chord: "+selectedChordOrg);//resetVariables();
        		//New functions
				callManagerHashTags();
				callManagerUserTags();
				callManagerKeywordTags();
				//callManagerRadicalTags();
				//callManagerCounterRadicalTags();
				//End of New functions
				callManager3();
				callManager4();
				callManager6();
				fade2(1);
	    		console.log("I am in 2");
				d3.select(this).style("fill", "black").style("stroke", "black");
				fade1(d.index,.1);
        	}
        	else if(selectedOrg!=clickedOrg && selectedOrg!="noOrg" ){
        		selectedOrg=clickedOrg;
				$("#center").text("Selected Org: "+selectedOrg);
			$("#right").text("Selected Chord: "+selectedChordOrg);//resetVariables();
        		//New functions
				callManagerHashTags();
				callManagerUserTags();
				callManagerKeywordTags();
				//callManagerRadicalTags();
				//callManagerCounterRadicalTags();
				//End of New functions
				callManager3();
				callManager4();
				callManager6();
				fade2(1);
				console.log("I am in 3");
				fade1(d.index,.1);
        		grp.style("fill", function(d) { return fill(d.index); })
		    	.style("stroke", function(d) { return fill(d.index); });
        		d3.select(this).style("fill", "black").style("stroke", "black");
        	}     
	    });
	
	    

	/*grp.append("title").text(function(d) {		
		return orgDetails(d.index);
	});	  */
	

	var ticks = svg.append("g")
	  .selectAll("g")
	  .data(chord.groups)
	  .enter().append("g")
	  .selectAll("g")
	  .data(groupTicks)
	  .enter().append("g")
	  .attr("transform", function(d) {
	      return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
	          	 + "translate(" + outerRadius + ",0)";
	  });
	

	ticks.append("line")
    .attr("x1", 1)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", 0)
    .style("stroke", "#000");

	ticks.append("text")
    .attr("x", 0)
    .attr("dy", ".35em")
	.style("font-weight", "bold")
	.style("font-size",14)
	.style("fill", function(d) {
      return d.color;
    })
    .attr("text-anchor", function(d) {
      return d.angle > Math.PI ? "end" : null;
    })
    .attr("transform", function(d) {
      return d.angle > Math.PI ? "rotate(180)translate(-16)" : null;
    })
    .text(function(d) { return d.label; });
	
	//onClick function to handle label clickables.
	var labelIndex;
	ticks.on("click",function(d) {
		//alert("hi "+d.label);
		selectedChordOrg="noChord";
    	chr.style("fill", function(d) { return fill(d.source.index); })
    	.style("stroke", function(d) { return fill(d.source.index); });
        //alert("IN "+orgNames[d.index]);
    	clickedOrg=d.label;
    	labelIndex=$.inArray($.trim(d.label), uniqueNames);
    	if(selectedOrg==clickedOrg){
    		selectedOrg="noOrg";
			$("#center").text("Selected Org: "+selectedOrg);
			$("#right").text("Selected Chord: "+selectedChordOrg);//resetVariables();
			//New functions
			callManagerHashTags();
			callManagerUserTags();
			callManagerKeywordTags();
			callManagerRadicalTags();
			callManagerCounterRadicalTags();
			//End of New functions
			callManager3();
			callManager4();
			callManager6();
			fade2(1);
    		grp.style("fill", function(d) { return fill(d.index); })
	    	.style("stroke", function(d) { return fill(d.index); });
    		/*ticks.style("fill", function(d) { d.color=fill(d.index);return fill(d.index); }).style("stroke", function(d) { return fill(d.index); });*/
    	}
    	else if(selectedOrg!=clickedOrg && selectedOrg=="noOrg" ){
    		selectedOrg=clickedOrg;
			$("#center").text("Selected Org: "+selectedOrg);
			$("#right").text("Selected Chord: "+selectedChordOrg);//resetVariables();
        	//New functions
			callManagerHashTags();
			callManagerUserTags();
			callManagerKeywordTags();
			callManagerRadicalTags();
			callManagerCounterRadicalTags();
			//End of New functions
			callManager3();
			callManager4();
			callManager6();
			fade2(1);
	    	fade1(labelIndex,.1);
			grp.style("fill", function(d) {
				if(clickedOrg==orgNames[d.index])
					return "black";
				else
					return fill(d.index);
			}).style("stroke", function(d) {
				if(clickedOrg==orgNames[d.index])
					return "black";
				else
					return fill(d.index);
			});
    		/*d3.select(this).style("fill", "black").style("stroke", "black");*/
			
    	}
    	else if(selectedOrg!=clickedOrg && selectedOrg!="noOrg" ){
    		selectedOrg=clickedOrg;
			$("#center").text("Selected Org: "+selectedOrg);
			$("#right").text("Selected Chord: "+selectedChordOrg);//resetVariables();
        	//New functions
			callManagerHashTags();
			callManagerUserTags();
			callManagerKeywordTags();
			callManagerRadicalTags();
			callManagerCounterRadicalTags();
			//End of New functions
			callManager3();
			callManager4();
			callManager6();
			fade2(1);
			fade1(labelIndex,.1);
    		grp.style("fill", function(d) { return fill(d.index); })
	    	.style("stroke", function(d) { return fill(d.index); });
    		grp.style("fill", function(d) {
				if(clickedOrg==orgNames[d.index])
					return "black";
				else
					return fill(d.index);
			}).style("stroke", function(d) {
				if(clickedOrg==orgNames[d.index])
					return "black";
				else
					return fill(d.index);
			});
    		/*ticks.style("fill", function(d) {  d.color=fill(d.index);return fill(d.index); }).style("stroke", function(d) { return fill(d.index); });
    		d3.select(this).style("fill", "black").style("stroke", "black");*/
    		
    	}     

	});
	
  
	var chr=svg.append("g")
    .attr("class", "chord")
    .selectAll("path")
    .data(chord.chords)
    .enter().append("path")
    .style("fill", function(d) { return fill(d.source.index); })
	.style("stroke", function(d) { return fill(d.source.index); })
    .attr("d", d3.svg.chord().radius(innerRadius))
    .style("opacity", 1);
    /*.style("opacity", function(d) {
		if(matrixTable[d.source.index][d.target.index]==1)
			return 0;
		else
			return 1;
	});*/
	

	chr.append("title").text(
		function(d) {
			return "From: " + OrgName(d.source.index) + "\nTo: "
					+ OrgName(d.target.index) + "\nMigrators: "
					+ matrixTable[d.source.index][d.target.index];
		});	  
	
	
	chr
	.on("click",function(d) {
		selectedOrg="noOrg";
		grp.style("fill", function(d) { return fill(d.index); })
    	.style("stroke", function(d) { return fill(d.index); });
        clickedChordOrg=orgNames[d.source.index]+'#'+orgNames[d.target.index];        
        if(selectedChordOrg==clickedChordOrg){
        	selectedChordOrg="noChord";
			$("#center").text("Selected Org: "+selectedOrg);
			$("#right").text("Selected Chord: "+selectedChordOrg);//resetVariables();			
        	//New functions
			callManagerHashTags();
			callManagerUserTags();
			callManagerKeywordTags();
			//callManagerRadicalTags();
			//callManagerCounterRadicalTags();
			//End of New functions
			callManager3();
			callManager4();
			callManager6();
        	chr.style("fill", function(d) { return fill(d.source.index); })
	    	.style("stroke", function(d) { return fill(d.source.index); });
			fade2(1);			
    	}
    	else if(selectedChordOrg!=clickedChordOrg && selectedChordOrg=="noChord" ){
    		selectedChordOrg=clickedChordOrg;
			$("#center").text("Selected Org: "+selectedOrg);
			$("#right").text("Selected Chord: "+selectedChordOrg);//resetVariables();			
        	//New functions
			callManagerHashTags();
			callManagerUserTags();
			callManagerKeywordTags();
			callManager3();
			callManager4();
			callManager6();
    		d3.select(this).style("fill", "black").style("stroke", "black");
    	}
    	else if(selectedChordOrg!=clickedChordOrg && selectedChordOrg!="noChord" ){
    		selectedChordOrg=clickedChordOrg;
			$("#center").text("Selected Org: "+selectedOrg);
			$("#right").text("Selected Chord: "+selectedChordOrg);//resetVariables();			
        	//New functions
			callManagerHashTags();
			callManagerUserTags();
			callManagerKeywordTags();
			callManager3();
			callManager4();
			callManager6();
        	chr.style("fill", function(d) { return fill(d.source.index); })
	    	.style("stroke", function(d) { return fill(d.source.index); });
    		d3.select(this).style("fill", "black").style("stroke", "black");
    	}    
    });
  },

  
});

function clr(){
	var ar=[];
	var numchord =uniqueNames.length;
	if(numchord%2==1)
	    numchord++;
	var freq=120/numchord;
	/*ar[0]='#000000';
	ar[1]='#000000';*/
	for(var i=0;i<=numchord/2;i++){
		//ar[i]=hsvToRgb((120-(freq*i)),100,100);
		ar[i]=hsvToRgb(120,100,(100-(freq*i)));
	}
	for(var i=numchord/2;i<=numchord;i++){
		//ar[i]=hsvToRgb((120-(freq*i)),100,100);
		ar[i]=hsvToRgb(0,100,((freq*i)));
	}
	return ar;

}
/**
 * HSV to RGB color conversion
 *
 * H runs from 0 to 360 degrees
 * S and V run from 0 to 100
 * 
 * Ported from the excellent java algorithm by Eugene Vishnevsky at:
 * http://www.cs.rit.edu/~ncs/color/t_convert.html
 */
function hsvToRgb(h, s, v) {
	var r, g, b;
	var i;
	var f, p, q, t;
 
	// Make sure our arguments stay in-range
	h = Math.max(0, Math.min(360, h));
	s = Math.max(0, Math.min(100, s));
	v = Math.max(0, Math.min(100, v));
 
	// We accept saturation and value arguments from 0 to 100 because that's
	// how Photoshop represents those values. Internally, however, the
	// saturation and value are calculated from a range of 0 to 1. We make
	// That conversion here.
	s /= 100;
	v /= 100;
 
	if(s == 0) {
		// Achromatic (grey)
		r = g = b = v;
		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}
 
	h /= 60; // sector 0 to 5
	i = Math.floor(h);
	f = h - i; // factorial part of h
	p = v * (1 - s);
	q = v * (1 - s * f);
	t = v * (1 - s * (1 - f));
 
	switch(i) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;
 
		case 1:
			r = q;
			g = v;
			b = p;
			break;
 
		case 2:
			r = p;
			g = v;
			b = t;
			break;
 
		case 3:
			r = p;
			g = q;
			b = v;
			break;
 
		case 4:
			r = t;
			g = p;
			b = v;
			break;
 
		default: // case 5:
			r = v;
			g = p;
			b = q;
	}
 
	//return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	r=Math.round(r * 255);
	g=Math.round(g * 255);
	b=Math.round(b * 255);
	
	  var rgb = [r.toString(16),g.toString(16),b.toString(16)]
	  for (var i=0;i<3;i++) {
		if (rgb[i].length==1) rgb[i]=rgb[i]+rgb[i];
	  }
	  if(rgb[0][0]==rgb[0][1] && rgb[1][0]==rgb[1][1] && rgb[2][0]==rgb[2][1])
		return '#'+rgb[0][0]+rgb[1][0]+rgb[2][0];
	  return '#'+rgb[0]+rgb[1]+rgb[2];
	
}
function Create2DArray(rows) {
	var arr = [];
	for ( var i = 0; i < rows; i++) {
		arr[i] = [];
		for ( var j = 0; j < rows; j++) {
			arr[i][j] = 0;
		}
	}
	return arr;
}

function OrgName(d){
	var orgName="Org ";
	if ((typeof(orgNames[d])=='undefined')||(orgNames[d].length==0)||(orgNames[d]=="")) {
         orgName+=d+1;
    }
	else{
		orgName=orgNames[d];	
	}
	return orgName;
}
	

function orgDetails(d) {
	var details = "";
	details = details + "**Outgoing links**";
	for ( var i = 0; i < matrixTable.length; i++) {
		if (matrixTable[d][i] != 0 && d != i) {
			details += "\n" + OrgName(d) + " to " + OrgName(i) + ": "
					+ matrixTable[d][i];
		}
	}
	details = details + "\n\n**Incoming links**";
	for ( var i = 0; i < matrixTable.length; i++) {
		if (matrixTable[i][d] != 0 && d != i) {
			details += "\n" + OrgName(i) + " to " + OrgName(d) + ": "
					+ matrixTable[i][d];
		}
	}
	return details;
}

/** Returns an array of tick angles and labels, given a group. */
function groupTicks(d) {
	var k = (d.endAngle - d.startAngle) / d.value;
	return d3.range(0, d.value, 500).map(function(v, i) {
		var colorsList = clr();
		var orgName1 = OrgName(d.index);
		return {
			angle : (d.startAngle + d.endAngle) / 2,
			color : colorsList[d.index],// "#0000FF",
			label : orgName1
		};
	});
}

/* Returns an event handler for fading a given chord group. */
function fade(opacity) {
	return function(g, i) {
		svg.selectAll("g.chord path").filter(function(d) {
			return d.target.index != i && d.source.index != i;
		}).transition().style("opacity", opacity);
	};
}

function fade1(i,opacity) { //console.log("opacity "+ i + " , "+opacity);
	return svg.selectAll("g.chord path").filter(function(d) {  //console.log(i + " , "+d.source.index+ " , "+d.target.index);
			return d.target.index != i && d.source.index != i;
		}).transition().style("opacity", opacity);
	
}

function fade2(opacity) {  
	return svg.selectAll("g.chord path").transition().style("opacity", opacity);
	
}



})(jQuery);
