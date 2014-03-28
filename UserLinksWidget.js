(function ($) {
AjaxSolr.UserLinksWidget = AjaxSolr.AbstractFacetWidget.extend({
afterRequest: function () {
	var self = this;
	var nnodes = 0;
	var nedges = 0;
	var nodeindexcount = 0;	
	var from;
	var to;
	var test = [];
	var NameToIndex = [];
	var NameToIndex_c = [];
	var IndexToName = [];
	var AllFromNames = [];
	var AllFromNames_U = [];
	var AllToNames = [];
	var AllNames = [];
	var AllNames_U = [];
	var AllNames_Count = [];
	var AllFromNamesCount = [];
	var AllToNamesCount = [];
	var neighbours = {};
	var betweenness = {};
	var output = [];
	var list = [];
	var top_users = [];
	var count_users = [];
	var test_len;
	var set_test_len;
	var toOrgToScreenNameMap = {};
	var FromOrgFromScreenNameMap = {};
	var nameOfOrg;

	var l = this.manager.response.response.docs.length;
	//console.log("length of docs for this date-->"+l);
	
	if(l == 0){
		//$('#network_users').empty();
		$('#network_users_main').hide("slow");
		$('#network_users').hide("slow");
		$('#network_users1').hide("slow");
		$('#pagewrap').css('height','1420px');//console.log("alert checking");
		//alert('Visualisation graph doesnt exist for this selection');
		hide_1 = 1;
		return;
	}
	else{
		// The below for-loop gets the neighbours of each and every user from the Solr 
		for(var i=0;i<l;i++){
			var doc = this.manager.response.response.docs[i];   
			
			toOrgToScreenNameMap[$.trim(doc.llToScreenName)] = [$.trim(doc.llToOrg)];
			FromOrgFromScreenNameMap[$.trim(doc.llFromScreenName)] = [$.trim(doc.llFromOrg)];
			
			if(polygon_flag == true){
				//console.log(doc.llFromOrg+" , "+doc.llToOrg+" , "+doc.llFromIntId+" , "+doc.llToIntId);
			}
			if($.inArray($.trim(doc.llFromScreenName),NameToIndex_c)!= -1){
				from = $.inArray($.trim(doc.llFromScreenName),NameToIndex_c);
			} 
			else {		
				from = nodeindexcount;
				IndexToName.push({
						name:$.trim(doc.llFromScreenName),
						index:from
					});
				nodeindexcount++;
				NameToIndex_c.push($.trim(doc.llFromScreenName));	
			}
			AllFromNames.push($.trim(doc.llFromScreenName));
			AllNames.push($.trim(doc.llFromScreenName));
			
			if($.inArray($.trim(doc.llToScreenName),NameToIndex_c)!= -1){
				to = $.inArray($.trim(doc.llToScreenName),NameToIndex_c);
			} 
			else {		
				to = nodeindexcount;
				IndexToName.push({
						name: $.trim(doc.llToScreenName),
						index: to
					});
				nodeindexcount++;
				NameToIndex_c.push($.trim(doc.llToScreenName));	
			}
			AllToNames.push($.trim(doc.llToScreenName));	
			AllNames.push($.trim(doc.llToScreenName));
			
			if($.inArray($.trim(doc.llFromScreenName),AllFromNames_U)== -1){
				neighbours[$.trim(doc.llFromScreenName)] = [$.trim(doc.llToScreenName)];
				AllFromNames_U.push($.trim(doc.llFromScreenName));
			}
			else{
				neighbours[$.trim(doc.llFromScreenName)].push($.trim(doc.llToScreenName));
			}		
		}// for-loop
		
		
		var data_length = AllNames.length;
		
		if(data_length != 0){
			// The below loop is to get the occurrence of each user
			$.each(AllNames,function(entryindex,entry){
				if($.inArray(entry,AllNames_U)== -1){
					var user_freq = $.grep(AllNames, function (elem) {
									return elem === entry;
								}).length;
					AllNames_Count.push({
						name: entry,
						freq: user_freq
					});
					AllNames_U.push(entry);
				}	
			});
			
			function compare_freq(a,b){
				if (a.freq > b.freq)
					return -1;
				if (a.freq < b.freq)
					return 1;
				return 0;
			}	
			// Sorting users in the decreasing order of their occurrences count
			AllNames_Count.sort(compare_freq);
			array_index = 0;
			//console.log("testing name"+AllNames_Count.length);
			// the following is to set the variable if there are < 100 users 
			test_len = AllNames_Count.length;
			if(test_len<100){
				set_test_len = test_len;
			}
			else{
				set_test_len = 100;
			}
			// Extracting the top 100 users based on count
			for(var top_db=0;top_db<set_test_len;top_db++){
				count_users.push({
					name: AllNames_Count[top_db].name,
					occurance: AllNames_Count[top_db].freq
				});

				if($.inArray(AllNames_Count[top_db].name,NameToIndex) == -1){
					NameToIndex.push(AllNames_Count[top_db].name);
					array_index++;
				}
			}
			
			
			nnodes = array_index;
			
			for(var q=0;q<NameToIndex.length;q++)
				betweenness[NameToIndex[q]]=0;
				
			//Begin Brandes Algorithm
			for(var i=0;i<nnodes;i++){
				var stack = [];
				var queue = [];
				var predecessor = {};
				var sigma = {};
				var d = {};
				var delta = {};
				
				for(var j=0;j<NameToIndex.length;j++){
					sigma[NameToIndex[j]]=0;	
				}
				
				for(var k=0;k<NameToIndex.length;k++){
					d[NameToIndex[k]]=-1;			
				}
				
				for(var m=0;m<NameToIndex.length;m++){
					delta[NameToIndex[m]]=0;	
				}

				//var sigma = new Array(nnodes).join('0').split('').map(parseFloat);
				//var d = Array.apply(null, new Array(nnodes-1)).map(Number.prototype.valueOf,-1);
				sigma[NameToIndex[i]] = 1;
				d[NameToIndex[i]] = 0;
				var ele = NameToIndex[i];
				queue.unshift(NameToIndex[i]);

				while(queue.length > 0){
					var v = queue.pop();
					stack.push(v);	
					if(neighbours[v]){
						for(var l=0;l<neighbours[v].length;l++){
							//console.log(v +" --> "+ neighbours[v][l]);
							var w = neighbours[v][l];
							
							if(d[w]<0){
								queue.unshift(w);
								d[w] = d[v] + 1;
								//console.log("for d of-->"+w+"  is "+d[w]);
							}
							
							if(d[w] = d[v]+1){
								sigma[w] = sigma[w] + sigma[v];
								//console.log("for sigma of-->"+w+"  is  "+sigma[w]);
								if(predecessor[w]){
									var t= predecessor[w].push(v);
									//console.log("predessor test--"+t);
								}								
								else
									predecessor[w] = [v];
									//console.log("predessor test init for--"+w+" is "+predecessor[w]);
							}						
						}
					}	
				}

				while(stack.length > 0){
					var popped = stack.pop();		
					if(predecessor[popped]){
						for(var n=0;n<predecessor[popped].length;n++){	
							//console.log("sigma of predecessor of--"+popped + "--is--"+sigma[predecessor[popped]] + "sigma of-->"+popped+"--is--"+sigma[popped]+" --delta of "+popped+"--is--"+delta[popped]);
							delta[predecessor[popped]] = delta[predecessor[popped]] + ((sigma[predecessor[popped]]/sigma[popped])*(1+delta[popped]));
							//console.log(predecessor[popped] + " --delta--> "+delta[predecessor[popped]]);	
						}
					}
					if(popped != ele)
						betweenness[popped] = betweenness[popped] + delta[popped];
					//console.log(popped + " --betweeness--> "+betweenness[popped]);
				}
				
			}//for-loop Algorithm
			//end-of-Brandes Algorithm
			
			var sumbetweenness = 0;
			for(var b=0;b<NameToIndex.length;b++)
				sumbetweenness = sumbetweenness + betweenness[NameToIndex[b]];

			for(var p=0;p<nnodes;p++){
				var node = NameToIndex[p];
				var btw = (betweenness[node]/sumbetweenness)*100;
				var outdeg = $.grep(AllFromNames, function (elem) {
									return elem === node;
								}).length;
				var out = (outdeg/(nnodes-1))*100;
				var indeg = $.grep(AllToNames, function (elem) {
									return elem === node;
								}).length;	
				var inn = (indeg/(nnodes-1))*1000;				
				
				output.push({
					name: node,
					btw: btw,
					out: out,
					inn: inn
				});
			}

			function compare(a,b) {
				if (a.btw > b.btw)
					return -1;
				if (a.btw < b.btw)
					return 1;
				return 0;
			}
			// Sorting by betweenness	
			output.sort(compare);
			
			var len_docs_week = this.manager.response.response.docs.length;
			var len_limit;
			if(len_docs_week < 7000)
				len_limit = 19;
			else
				len_limit = 10;
				
			var len_of_output = output.length;
			for(var t=0;t<len_of_output;t++){
				var obj = output[t];
				top_users.push(obj.name+','+t+','+obj.inn+','+obj.out+','+obj.btw);
				if(t == len_limit)
					break;
			}
							
			function linkFrom(source, target, rank, indgr, outdgr, btw) {
				this.source = source;
				this.target = target;
				this.rankF = rank;
				this.authorityF = indgr;
				this.hubF = outdgr;
				this.centralityF = btw;
			}

			function linkTo(source, target, rank, indgr, outdgr, btw) {
				this.source = source;
				this.target = target;
				this.rankT = rank;
				this.authorityT = indgr;
				this.hubT = outdgr;
				this.centralityT = btw;
			}
			
			var top_users_len = top_users.length;
			var links = [];
			var all_length = this.manager.response.response.docs.length;
			for(var f=0;f<all_length;f++){ 
				var doc = this.manager.response.response.docs[f];   
				var temp = $.trim(doc.llFromScreenName);
				var temp1 = $.trim(doc.llToScreenName);//console.log("in all links f  "+temp+ ","+temp1);
				for(var g=0;g<top_users_len;g++){ 
					var temp2 = top_users[g].split(",");//console.log("in top links g  "+temp2[0]);
					if(temp == temp2[0]){ //console.log("here");
						links.push(new linkFrom(temp, temp1, parseInt(temp2[1])+1, 
						parseFloat(temp2[2]), parseFloat(temp2[3]), parseFloat(temp2[4])));
						//console.log(parseInt(temp2[1])+1);
						break;

					}
					else if(temp1 == temp2[0]){ //console.log("here");
						links.push(new linkTo(temp, temp1, parseInt(temp2[1])+1, 
						parseFloat(temp2[2]), parseFloat(temp2[3]), parseFloat(temp2[4])));
						//console.log(parseInt(temp2[1])+1);						
						break;
					}
				}
			}

			var nodes = {};
			// Compute the distinct nodes from the links.
			links.forEach(function(link) {		
				//console.log(nodes[link.source]);
				link.source = nodes[link.source] || 
				(nodes[link.source] = {name: link.source, rank: link.rankF, centrality: link.centralityF, authority: link.authorityF, hub: link.hubF });
				
				link.target = nodes[link.target] || 
				(nodes[link.target] = {name: link.target, rank: link.rankT, centrality: link.centralityT, authority: link.authorityT, hub: link.hubT });

			});
			//console.log(links);
			//console.log(nodes.length + ","+links.length);
		} 
		else {
			alert("Data doesn't exist for this");
		}
	}	
	
	if(hide_1 == 1){
			$('#network_users').show("slow");
			$('#network_users').show("slow");
			$('#network_users1').show("slow");
			$('#pagewrap').css('height','1915px');
			hide_1 = 0;console.log("in opening hide --> show");
	}
	$('#network_users').empty();
	$('#network_users1').empty();
	// 950,700,8
	var w = 510,
		h = 450;
		r = 5;
		
	var color = d3.scale.linear()
			.domain([1,20,21])
			.range(["#FF0000", "#FFEAEA", "#5B5BFF"]);

	var vis = d3.select("#network_users")
				.append("svg:svg")
					.attr("width", w)
					.attr("height", h)
					.attr("pointer-events", "all")
				.append('svg:g')
				.call(d3.behavior.zoom().on("zoom", redraw))
				.append('svg:g');
		    	
	vis.append('svg:rect')
    		.attr('width', w)
    		.attr('height', h)
    		.attr('fill', 'aliceblue');
    
	
	// Per-type markers, as they don't inherit styles.
	vis.append("svg:defs").selectAll("marker")
    		.data(["end"])
  		.enter().append("svg:marker")
    		.attr("id", String)
    		.attr("viewBox", "0 0 10 10")
    		.attr("refX", 20)
    		.attr("refY", 0)
    		.attr("markerWidth", 11)
    		.attr("markerHeight", 7)
    		.attr("orient", "auto")
  		.append("svg:path")
    		.attr("d", "M0,-5L10,0L0,5");

	var force = d3.layout.force()
    			.nodes(d3.values(nodes))
    			.links(links)
    			.size([w, h])
    			.charge(-120)
    			.linkDistance(40)
    			//.theta(0.6)
    			.friction(0.5)
    			//.gravity(0.05)
				.on("tick", tick)
    			.start();
	
	// add the links and the arrows
	var path = vis.append("svg:g").selectAll("path")
		.data(force.links(), function(d) { return d.source.name + "-" + d.target.name; })
		.enter().append("svg:path")
		.attr("class", "link")
		.attr("marker-end", "url(#end)")
		.style("stroke-width", function(d) { return Math.sqrt(d.value); });
		
	
	// create link text
	var pathtext = vis.selectAll("g.linklabelholder").data(links);
	pathtext.enter().append("g").attr("class","linklabelholder")
		.append("text")
		.attr("class","linklabel")
		.attr("dx", 1)
		.attr("dy", ".35em")
		.attr("text-anchor", "middle")
		.text(function(d) { if(d.value > 1) { return d.value; } });
		
	// define the nodes
	var node = vis.selectAll(".node")
		.data(force.nodes())
		.enter().append("g")
		.attr("class", "node")
		.on("mouseover", fade(.1)).on("mouseout", fade(1))
        .on("click",function(d,i) {
				href="https://twitter.com/"+d.name;
				window.open(href,'name','width=800,height=500');
		})
		.call(force.drag);
	
	/* loading code
	loadingText = vis.append("svg:text")
    .attr("class", "loading")
    .attr("x", (w/2)-200)
    .attr("y", h/2)
    .text("Loading");
	*/
	// add the nodes
	node.append("circle")
		.style("fill", function(d) { 
			if(!isEmpty(d.rank)) {
				if(FromOrgFromScreenNameMap[d.name]){
					nameOfOrg = FromOrgFromScreenNameMap[d.name];
				}
				else{
					nameOfOrg = toOrgToScreenNameMap[d.name];
				}
				
				$('#network_users1').append('<a href ="http://www.twitter.com/'+d.name+'" target="_blank">'+d.name+'</a>'+" ("+nameOfOrg+")"+'<br/>');
				//$('#network_users1').
				return color(d.rank);
			} 
			else {
				d.rank = 21; 
				return color(d.rank);
			} 
		})			
		.attr("r", 5);

	// add the text
	node.append("title")
		.text(function(d) { return d.name; });
	
  	function tick() {
		//if(force.start()){
		//	vis.select(".loading").remove();
			path.attr("d", function(d) {
			var dx = d.target.x - d.source.x,
		    	dy = d.target.y - d.source.y,
   		    	dr = 100000;
			return "M" +
				d.source.x + "," +
				d.source.y + "A" +
				dr + "," + dr + " 0 0,0 " +
				d.target.x + "," +
				d.target.y;
			});
			// add link text
			pathtext.attr("transform", function(d) {
				return "translate(" + (d.source.x + d.target.x) / 2 + ","
				+ (d.source.y + d.target.y) / 2 + ")"; });
			node
				.attr("transform", function(d) {
					return "translate(" + d.x + "," + d.y + ")"; });
					
			node.attr("cx", function(d) { return d.x = Math.max(r, Math.min(w - r, d.x)); })
				.attr("cy", function(d) { return d.y = Math.max(r, Math.min(h - r, d.y)); });
		//}
		//else{
			//loadingText.text(function(){return "Calculating Optimum Layout: " + Math.round((1 - (e.alpha * 10 - 0.1)) * 100) + "%"});
		//}
			
	}
	
	function isEmpty(obj) {
		if (typeof obj == 'undefined' || obj === null || obj === '') return true;
		if (typeof obj == 'number' && isNaN(obj)) return true;
		if (obj instanceof Date && isNaN(Number(obj))) return true;
		return false;
	}

	var linkedByIndex = {};
    links.forEach(function(d) {
        linkedByIndex[d.source.index + "," + d.target.index] = 1;
    });
	
    
	function fade(opacity) {
        return function(d) {
            node.style("stroke-opacity", function(o) {
                thisOpacity = isConnected(d, o) ? 1 : opacity;
                this.setAttribute('fill-opacity', thisOpacity);
				return thisOpacity;
            });

            path.style("stroke-opacity", opacity).style("stroke-opacity", function(o) {
                return o.source === d || o.target === d ? 1 : opacity;
            });
			
			/*d3.select(this).select("circle").transition()
											.duration(750)
											.attr("r", 8);*/
        };
    }
	
	function normalizeNodesAndRemoveLabels() {
		return function(d, i) {
			selectedLabelIndex = null;
			vis.selectAll(".path").style("stroke-opacity", 1);
			vis.selectAll(".circle").style("stroke-opacity", 1).style("fill-opacity", .5).style("stroke-width", 1);
			vis.selectAll(".nodetext").remove();
		}
	}
	
	function isConnected(a, b) {
        return linkedByIndex[a.index + "," + b.index] || linkedByIndex[b.index + "," + a.index] || a.index == b.index;
    }

	function redraw() {
  		vis.attr("transform",
      		"translate(" + d3.event.translate + ")"
      		+ " scale(" + d3.event.scale + ")");	
	}
	
	
} //after request function
});
})(jQuery);