	var parse_role_name = new Array("PrimeMinister","LeaderOpposition","MemberGovernment","MemberOpposition","ReplyPM","LOReply");
	var hangout_role_name = new Array("PrimeMinister","LeaderOpposition","MemberGovernment","MemberOpposition","ReplyPM","LOReply","Audience1","Audience2","Audience3","Audience4");
	var role_button_id = new Array("btn_PrimeMinister","btn_LeaderOpposition","btn_MemberGovernment","btn_MemberOpposition","btn_ReplyPM","btn_LOReply");
	var role_speaker = new Array("speaker_PrimeMinister","speaker_LeaderOpposition","speaker_MemberGovernment","speaker_MemberOpposition","speaker_ReplyPM","speaker_LOReply");
	var hangout_POI_role = new Array("Poi_PM","Poi_LO","Poi_MG","Poi_MO","PoiRPM","Poi_LOR");
	var poi_button_name = new Array("bt_Poi_PM","bt_Poi_LO","bt_Poi_MG","bt_Poi_MO","bt_PoiRPM","bt_Poi_LOR");
	var Participant_Role_Group = new Array("Proposition", "Opposition","Proposition", "Opposition","Proposition", "Opposition","Audience","Audience","Audience","Audience","Audience","Audience","Audience","Audience");


Mixidea_Event.prototype.check_hangout_Poi_status = function(){
	for(i=0;i<6;i++){
		var poi_status = gapi.hangout.data.getValue(hangout_POI_role[i]);
		console.log( hangout_POI_role[i] + " status is " + poi_status);
	}
}

Mixidea_Event.prototype.reset_hangout_Poi_status = function(){
	gapi.hangout.data.submitDelta({
		"Poi_PM" : "",
		"Poi_LO" : "",
		"Poi_MG" : "",
		"Poi_MO" : "",
		"PoiRPM" : "",
		"Poi_LOR" : ""
	});
}


Mixidea_Event.prototype.check_hangoutid_for_each_role = function(){

	var PM_id = gapi.hangout.data.getValue("RoleID_PM");
	console.log("PM_id is " + PM_id + "PM name is " + self.participants_profile_EachRole[0].FirstName);
	var LO_id = gapi.hangout.data.getValue("RoleID_LO");
	console.log("LO_id is " + LO_id + "LO name is " + self.participants_profile_EachRole[1].FirstName);
	var MG_id = gapi.hangout.data.getValue("RoleID_MG");
	console.log("MG_id is " + MG_id + "MG name is " + self.participants_profile_EachRole[2].FirstName);
	var MO_id = gapi.hangout.data.getValue("RoleID_MO");
	console.log("MO_id is " + MO_id + "MO name is " + self.participants_profile_EachRole[3].FirstName);
	var RPM_id = gapi.hangout.data.getValue("RoleID_RPM");
	console.log("RPM_id is " + RPM_id + "RPM name is " + self.participants_profile_EachRole[4].FirstName);
	var RLO_id = gapi.hangout.data.getValue("RoleID_RLO");
	console.log("RLO_id is " + RLO_id + "RLO name is " + self.participants_profile_EachRole[5].FirstName);
} 



function Mixidea_Event(){

	Parse.initialize("rc8Zz9FHNj4FVgabkbjRPbPrlLXQQpoL9NRrI7FZ", "fYVcXHYQqvSLRMmRQ274PEmmUfj5OnwTHrRwXlNm");
	var appData = gadgets.views.getParams()['appData'];	
	console.log(appData);
	var appData_split = appData.split("_");

	this.info = {};
	this.info.user_id = appData_split[0];
	this.info.event_id = appData_split[1];
	console.log(this.info.user_id);
	console.log(this.info.event_id);

	this.local = {};
	this.local.current_speaker = null;
	this.local.current_personalfeed_ui = null;
	this.local.Participant_Id = gapi.hangout.getLocalParticipantId();
	console.log("my id is " + this.local.Participant_Id );
	this.local.ui_mode = "";	// speaker, discussion, poi_taken_speaker, audience. poi_taken_audience
	this.local.ownrole_number = [];
	this.local.complete_count = Number(gapi.hangout.data.getValue("complete_count"));
	if(!this.local.complete_count){
		this.local.complete_count = 0;
	}
	this.local.init_complete=false;

	this.local.refresh_count = Number(gapi.hangout.data.getValue("refresh_count"));
	if(!this.local.refresh_count){
		this.local.refresh_count = 0;
	}

	this.obj = {};	
	this.obj.event = null;
	this.info.event_type = "";
	this.ownrole = [];
	this.participants_hangoutid_array = [];
	this.participants_hangoutid_array = gapi.hangout.getParticipants();

	this.title_count = 0;
	var current_title_count = Number(gapi.hangout.data.getValue('title_count'));
	if(current_title_count){
		this.title_count = current_title_count;
	}

	this.participants_obj = [];
	this.participant_role = [];
	this.participants_profile_EachRole = [];
	this.feed;
	this.canvas = gapi.hangout.layout.getVideoCanvas();
	this.initial_setting();
	this.speech_duration = 0;
	this.speech_timer = [];
	this.event_title = "";
	this.group_partner_hangout_id = [];
	this.own_group = "";

}


/////////////initial setting ///////////

Mixidea_Event.prototype.initial_setting = function(){

	var self = this;
	//initial setting 
	self.SetEventURL().then(function(){
		self.Check_OwnRole_and_Share();
		self.Draw_EventTitle();
		return self.RetrieveParticipantsData_on_Event_NA();
	}).then(function(){
		self.prepareDOM_ParticipantField_NA();
		self.Get_group_member_id();
		self.PrepareDom_forPersonalFeed()
		self.DrawVideoFeed();
		self.PrepareDom_for_chat_field();
		self.init_setting_comoplete();
	});
}


Mixidea_Event.prototype.SetEventURL = function(){
	console.log("SetEventURL");
	var self = this;
	var d = new $.Deferred;

	var query_event = new Parse.Query(MixideaEvent);
	query_event.get(self.info.event_id).then(function(event_obj){
		console.log("get event obj");

		self.obj.event = event_obj;
		var hangout_url = event_obj.get("hangout_url");
		console.log(hangout_url);
		if(!hangout_url){
			hangout_url = gapi.hangout.getHangoutUrl();
			event_obj.set("hangout_url", hangout_url);
			console.log(hangout_url);
		}
		return event_obj.save();
	}).then(function(){
		console.log("event has been registered to parse");
		d.resolve();
	}, function(error){
		d.reject("Error!!");
		console.log("error of seteventurl");
	});
	return d.promise();
}


Mixidea_Event.prototype.Draw_EventTitle = function(){

	var self = this;
	self.Display_event_title_default();

	$("div#event_right").on("click","button#update_motion" ,function(){

		var form_element = $("<form/>");
		form_element.attr({'name':'form_event_title'});
		form_element.attr({'id':'form_event'});


		var input_element =  $("<input/>");
		input_element.attr({'type':'text'});
		input_element.attr({'id':'event_title_input'});
		input_element.attr({'value':self.event_title});
		form_element.append(input_element);
		$("div#event_left").html(form_element);

		var update_execution_button = $("<button/>");
		update_execution_button.attr({'id':"event_update_execution"});
		update_execution_button.attr({'float':"left"});
		update_execution_button.append("apply");

		var update_cancel_button = $("<button/>");
		update_cancel_button.attr({'id':"event_update_cancel"});
		update_cancel_button.attr({'float':"left"});
		update_cancel_button.append("cancel");

		$("div#event_right").html("");
		$("div#event_right").append(update_execution_button);
		$("div#event_right").append(update_cancel_button);
	})

	$("div#event_right").on("click","button#event_update_cancel" ,function(){
		self.Display_event_title_default();
	})
	$("div#event_right").on("click","button#event_update_execution" ,function(){
		 var event_title_string = document.forms.form_event.event_title_input.value;
		 console.log(event_title_string);

		 self.obj.event.fetch().then(function(event_obj){
		 	event_obj.set("title",event_title_string);
		 	return event_obj.save()
		 }).then(function(){
		 	var count_up = self.title_count +1;
		 	var title_count_up = String(count_up);
			gapi.hangout.data.setValue("title_count", title_count_up);
		 });

	})
}

Mixidea_Event.prototype.Display_event_title_default = function(){
	var self = this;

	self.event_title = self.obj.event.get("title");
	$("div#event_left").html("<strong><h4>Motion : " + self.event_title + "</h4></strong>");

	var update_motion_button = $("<button/>");
	update_motion_button.attr({'id':"update_motion"});
	update_motion_button.append("update motion");
	$("div#event_right").html(update_motion_button);

}



Mixidea_Event.prototype.Check_OwnRole_and_Share = function(){
	
	console.log("check own role and share");
	var self = this;

	self.local.ownrole_number.splice(0);

	for(j=0;j<6;j++){
		self.participants_obj[j] = self.obj.event.get(parse_role_name[j]);
		console.log("number is " +j );
		if(self.participants_obj[j]){
			console.log("id is " + self.participants_obj[j].id);
			if(self.participants_obj[j].id == self.info.user_id){
				gapi.hangout.data.setValue( hangout_role_name[j], self.local.Participant_Id);
				self.local.ownrole_number.push(j);
				self.own_group = Participant_Role_Group[j];
			}
		}
	}
}

Mixidea_Event.prototype.RetrieveParticipantsData_on_Event_NA = function(){

	console.log("RetrieveParticipantsData");
	var self = this;
	var d = new $.Deferred;

	var f1 = function(){
		if(i<6){
			self.participants_obj[i] = self.obj.event.get(parse_role_name[i]);
			if(self.participants_obj[i]){
				var user_query = new Parse.Query(MixideaUser);
				user_query.equalTo("objectId", self.participants_obj[i].id);
				var query_promise = user_query.find({
					success: function(participant_o){
						self.participants_profile_EachRole[i] = {"FirstName":participant_o[0].get("FirstName"),
										   "LastName":participant_o[0].get("LastName"),
										   "Profile_picture":participant_o[0].get("Profile_picture"),
											"existence_flag": true
										   };
						i++;
					}
				})
				query_promise.done(f1);
			}else{
				self.participants_profile_EachRole[i] = {"FirstName":"no one apply",
										"LastName":"-",
										"Profile_picture":"#",
										"existence_flag": false
										};
				i++;
				f1();
			}
		}else if(i == 6){
			console.log("retrieving participant object finish");
			self.local.own_name = self.participants_profile_EachRole[self.local.ownrole_number[0]].FirstName;
			d.resolve();
			return;
		}
	}
	var i=0;
	f1();
	return d.promise();
}

Mixidea_Event.prototype.prepareDOM_ParticipantField_NA = function(){

	var self = this;
	var eachfeed_td = {};
	var eachfeed_element = {};
	var profile_pict_element = {};
	var profile_name_element = {};
	var role_name = new Array("PM","LO","MG","MO","PMR","LOR");
	var participant_container = $("<div>");
	participant_container.attr({'align':'center'});

	console.log("prepare dom participant na");

	for(i=0;i<6;i++){
		eachfeed_td[i] = $("<td>");


		console.log("paricipant number = " +  i);
		if(self.participants_profile_EachRole[i].existence_flag){

			eachfeed_element[i] = $("<div>");
			eachfeed_element[i].attr({'id': role_name[i]});
			profile_pict_element[i] = $("<img>");
			profile_pict_element[i].attr({'src': self.participants_profile_EachRole[i].Profile_picture});
			profile_name_element[i] = $("<p>");
			profile_name_element[i].append( self.participants_profile_EachRole[i].FirstName + self.participants_profile_EachRole[i].LastName );
			
			var role_identifier = gapi.hangout.data.getValue( hangout_role_name[i] );
			if(role_identifier && self.hangout_id_exist(role_identifier)){
				eachfeed_td[i].attr({'bgcolor': '99CC00'});
				console.log("user loged in id is " + role_identifier);
			}else{
				profile_name_element[i].append("<br>not yet login"); 
				eachfeed_td[i].attr({'bgcolor': 'C0C0C0'});
				console.log("user not yet login id is " + role_identifier);
			}
			eachfeed_element[i].append(profile_pict_element[i]);
			eachfeed_element[i].append(profile_name_element[i]);

		}else{
			eachfeed_td[i].attr({'bgcolor': '808080'});
			eachfeed_element[i] = $("<div>");
			eachfeed_element[i].attr({'id': role_name[i]});
			eachfeed_element[i].append("no one has applied");
			console.log("no one has applied");

		}

		eachfeed_td[i].append(eachfeed_element[i]);
		console.dirxml(eachfeed_td[i]);
	}
	var table_element = $("<table>");
	table_element.attr({'border': '1'});

	var table_caption_element = $("<caption>");
	table_caption_element.append("<center> - participants - </center>");

	table_header_row = $("<tr>"); 
	table_header_left = $("<th>"); 
	table_header_left.append("prop");
	table_header_right = $("<th>"); 
	table_header_right.append("opp");
	table_header_row.append(table_header_left);
	table_header_row.append(table_header_right);


	first_row = $("<tr>");
	first_row.append(eachfeed_td[0]);
	first_row.append(eachfeed_td[1]);
	second_row = $("<tr>");
	second_row.append(eachfeed_td[2]);
	second_row.append(eachfeed_td[3]);
	third_row = $("<tr>");
	third_row.append(eachfeed_td[4]);
	third_row.append(eachfeed_td[5]);


	table_element.append(table_caption_element);
	table_element.append(table_header_row);
	table_element.append(first_row);
	table_element.append(second_row);
	table_element.append(third_row);

	refresh_participant_button = $("<button>"); 
	refresh_participant_button.attr({'align':'center'});
	refresh_participant_button.attr({'id':'refresh_participant'});
	refresh_participant_button.addClass('btn btn-default');
	refresh_participant_button.append('refresh participant info from server');

	participant_container.append(table_element);
	participant_container.append("<br>");
	participant_container.append(refresh_participant_button);
	$("div#common_feed").html(participant_container);


	$("button#refresh_participant" ).click(function(){
		

		console.log("refresh participant button is clicked");
		//update participant field

		var refresh_count = gapi.hangout.data.getValue("refresh_count");
		var num_refresh = Number(refresh_count);

		if(isNaN(num_refresh)){
			num_refresh = self.local.refresh_count;
		}
		num_refresh++;
		refresh_count = String(num_refresh);
		gapi.hangout.data.setValue("refresh_count", refresh_count);


	})


}

Mixidea_Event.prototype.Get_group_member_id = function(){

	console.log("Get_group_member_id");
	var self = this;

	self.group_partner_hangout_id.splice(0);

	console.log("own group is " + self.own_group);

	for(i=0;i<9;i++){
		var role_id = gapi.hangout.data.getValue(hangout_role_name[i]);
		console.log("role id " + i + " = " + role_id + " of group is " + Participant_Role_Group[i]);
		if( Participant_Role_Group[i] == self.own_group && self.hangout_id_exist(role_id) ){
			self.group_partner_hangout_id.push(role_id);
			console.log("group member " + i + " = " + role_id);
		}
	}
}



Mixidea_Event.prototype.PrepareDom_forPersonalFeed = function(){

	var self = this;

	var hangout_shared_current_POI_speaker = gapi.hangout.data.getValue('CurrentPoiId');
	var hangout_shared_current_speaker = gapi.hangout.data.getValue('CurrentSpeakerId');

	if(hangout_shared_current_POI_speaker && self.hangout_id_exist(hangout_shared_current_POI_speaker)){
		self.PrepareDom_forPersonalFeed_PoiListener_Audience();	
	
	}else if(hangout_shared_current_speaker  && self.hangout_id_exist(hangout_shared_current_speaker)){
		self.PrepareDom_forPersonalFeed_Listener();
	
	}else{
		self.PrepareDom_forPersonalFeed_Discussion();
	}
}



//personal feed drawing
Mixidea_Event.prototype.PrepareDom_forPersonalFeed_Discussion = function(){

	var self = this;

	$("div#personal_control_1").html("");

	var StartSpeech_button_elements = $("<div/>");
	StartSpeech_button_elements.attr({'align': 'center'});
	for(i=0;i <self.local.ownrole_number.length; i++){
		var one_button_element = $("<button/>");
		one_button_element.addClass('btn btn-success');
		one_button_element.attr({'id': role_button_id[self.local.ownrole_number[i]] });
		one_button_element.append("speaker as" + hangout_role_name[self.local.ownrole_number[i]]);
		StartSpeech_button_elements.append(one_button_element);	
		StartSpeech_button_elements.append("<br><br>");	
	}

	$("div#personal_control_1").append("<h4>Click to be a speaker</h4>");
	$("div#personal_control_1").append(StartSpeech_button_elements);
	
	$("button#" + role_button_id[0] ).click(function(){
			console.log(hangout_role_name[0])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerRole": hangout_role_name[0],
			"CurrentSpeakerName": self.local.own_name
			});
			self.PrepareDom_forPersonalFeed_Speaker();
			self.reset_hangout_Poi_status();
	})
	$("button#" + role_button_id[1] ).click(function(){
			console.log(hangout_role_name[1])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerRole": hangout_role_name[1],
			"CurrentSpeakerName": self.local.own_name
			});
			self.PrepareDom_forPersonalFeed_Speaker();
			self.reset_hangout_Poi_status();
	})
	$("button#" + role_button_id[2] ).click(function(){
			console.log(hangout_role_name[2])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,    
			"CurrentSpeakerRole": hangout_role_name[2],
			"CurrentSpeakerName": self.local.own_name
			});
			self.PrepareDom_forPersonalFeed_Speaker();
			self.reset_hangout_Poi_status();
	})
	$("button#" + role_button_id[3] ).click(function(){
			console.log(hangout_role_name[3])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerRole": hangout_role_name[3],
			"CurrentSpeakerName": self.local.own_name
			});
			self.PrepareDom_forPersonalFeed_Speaker();
			self.reset_hangout_Poi_status();
	})
	$("button#" + role_button_id[4] ).click(function(){
			console.log(hangout_role_name[4])
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerRole": hangout_role_name[4],
			"CurrentSpeakerName": self.local.own_name
			});
			self.PrepareDom_forPersonalFeed_Speaker();
			self.reset_hangout_Poi_status();
	})
	$("button#" + role_button_id[5] ).click(function(){
			console.log(hangout_role_name[5]);
			gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": self.local.Participant_Id,
			"CurrentSpeakerRole": hangout_role_name[5],
			"CurrentSpeakerName": self.local.own_name
			});
			self.PrepareDom_forPersonalFeed_Speaker();
			self.reset_hangout_Poi_status();
	})
	self.local.current_personalfeed_ui = "Discussion";
}

//personal feed drawing
Mixidea_Event.prototype.PrepareDom_forPersonalFeed_Speaker = function(){

	var self = this;
	$("div#personal_control_1").html("");
	
	var CompleteSpeech_elements = $("<div/>");
	CompleteSpeech_elements.attr({'align': 'center'});

	var complete_button_element = $("<button/>");
	complete_button_element.addClass('btn btn-primary');
	complete_button_element.attr({'id': 'CompleteSpeech'});
	complete_button_element.append("complete your speech");
	CompleteSpeech_elements.append("<h3>Click to finish speach</h3>");
	CompleteSpeech_elements.append(complete_button_element);
	$("div#personal_control_1").append(CompleteSpeech_elements);
	$("button#CompleteSpeech").click(function(){
		console.log("complete speech");
		gapi.hangout.data.submitDelta({
			"CurrentSpeakerId": "",
			"CurrentSpeakerName": ""
		});
		$("div#personal_control_1").html("");
		$("div#personal_control_2").html("");
		self.PrepareDom_forPersonalFeed_Discussion();
	});
	self.local.current_personalfeed_ui = "Speaker";
}

Mixidea_Event.prototype.DrawPoiTakenField_ForSpeaker = function(){

	var self=this;

	$("div#personal_control_2").html("");

	var PoiTake_elements = $("<div/>");
	PoiTake_elements.attr({'align':'left'});
	var ul_poi_user_elements = $("<ul/>");

	self.check_hangoutid_for_each_role();
	var hangout_state = gapi.hangout.data.getState();

	for(i=0;i <6; i++){
		var role_flag2 = hangout_state[hangout_POI_role[i]];
		if(role_flag2 &&  self.hangout_id_exist(role_flag2)){
			var poi_role_li = $("<li/>");
			var poi_button = $("<button/>");
			poi_button.attr({'id': poi_button_name[i]});
			poi_button.addClass('btn btn-success');
			poi_button.append('TakePoi');
			poi_role_li.append(poi_button);

			poi_role_li.append(" " + self.participants_profile_EachRole[i].FirstName + " ");
			poi_role_li.append(self.participants_profile_EachRole[i].LastName);
			poi_role_li.append("<hr color='FF0000'>");
			ul_poi_user_elements.append(poi_role_li);
		}
	}
	PoiTake_elements.append("<br>");
	PoiTake_elements.append(ul_poi_user_elements);

	$("div#personal_control_2").append(PoiTake_elements);

	$("div#personal_control_2").on("click","button#" + poi_button_name[0] ,function(){
			console.log(poi_button_name[0]);
			var poi_speaker_id = gapi.hangout.data.getValue("Poi_PM");
			gapi.hangout.data.submitDelta({
			"CurrentPoiId": poi_speaker_id,
			"CurrentPoiSpeakerName": self.participants_profile_EachRole[0].FirstName 
			});
			$("div#personal_control_2").html("");
			self.reset_hangout_Poi_status();
			self.PrepareDom_forPersonalFeed_PoiListener_speaker();
	})

	$("div#personal_control_2").on("click","button#" + poi_button_name[1] ,function(){
			console.log(poi_button_name[1]);
			var poi_speaker_id = gapi.hangout.data.getValue("Poi_LO");
			gapi.hangout.data.submitDelta({
			"CurrentPoiId": poi_speaker_id,
			"CurrentPoiSpeakerName": self.participants_profile_EachRole[1].FirstName 
			});
			$("div#personal_control_2").html("");
			self.reset_hangout_Poi_status();
			self.PrepareDom_forPersonalFeed_PoiListener_speaker();
	})

	$("div#personal_control_2").on("click","button#" + poi_button_name[2] ,function(){
			console.log(poi_button_name[2]);
			var poi_speaker_id = gapi.hangout.data.getValue("Poi_MG");
			gapi.hangout.data.submitDelta({
			"CurrentPoiId": poi_speaker_id,
			"CurrentPoiSpeakerName": self.participants_profile_EachRole[2].FirstName 
			});
			$("div#personal_control_2").html("");
			self.reset_hangout_Poi_status();
			self.PrepareDom_forPersonalFeed_PoiListener_speaker();
	})

	$("div#personal_control_2").on("click","button#" + poi_button_name[3] ,function(){
			console.log(poi_button_name[3]);
			var poi_speaker_id = gapi.hangout.data.getValue("Poi_MO");
			gapi.hangout.data.submitDelta({
			"CurrentPoiId": poi_speaker_id,
			"CurrentPoiSpeakerName": self.participants_profile_EachRole[3].FirstName 
			});
			$("div#personal_control_2").html("");
			self.reset_hangout_Poi_status();
			self.PrepareDom_forPersonalFeed_PoiListener_speaker();
	})

	$("div#personal_control_2").on("click","button#" + poi_button_name[4] ,function(){
			console.log(poi_button_name[4]);
			var poi_speaker_id = gapi.hangout.data.getValue("PoiRPM");
			gapi.hangout.data.submitDelta({
			"CurrentPoiId": poi_speaker_id,
			"CurrentPoiSpeakerName": self.participants_profile_EachRole[4].FirstName 
			});
			$("div#personal_control_2").html("");
			self.reset_hangout_Poi_status();
			self.PrepareDom_forPersonalFeed_PoiListener_speaker();
	})

	$("div#personal_control_2").on("click","button#" + poi_button_name[5] ,function(){
			console.log(poi_button_name[5]);
			var poi_speaker_id = gapi.hangout.data.getValue("Poi_LOR");
			gapi.hangout.data.submitDelta({
			"CurrentPoiId": poi_speaker_id,
			"CurrentPoiSpeakerName": self.participants_profile_EachRole[5].FirstName 
			});
			$("div#personal_control_2").html("");
			self.reset_hangout_Poi_status();
			self.PrepareDom_forPersonalFeed_PoiListener_speaker();
	})

}

//personal feed drawing
Mixidea_Event.prototype.PrepareDom_forPersonalFeed_Listener = function(){

	var self = this;
	$("div#personal_control_1").html("");
	
	var Poi_element = $("<div/>");
	Poi_element.attr({'align': 'center'});
	Poi_element.append("click here to oppose speaker<br>");

	var poi_button_element = $("<button/>");
	poi_button_element.addClass('btn btn-success');
	poi_button_element.attr({'id': 'Poi'});
	poi_button_element.append("Poi!!");
	Poi_element.append(poi_button_element);
	$("div#personal_control_1").append(Poi_element);

	$("div#personal_control_1").on("click","button#Poi_cancel" ,function(){
		console.log("poi_cancel");
		$("div#personal_control_1").html("");
		var Poi_element = $("<div/>");
		Poi_element.attr({'align': 'center'});
		Poi_element.append("click here to oppose speaker<br>");

		var poi_button_element = $("<button/>");
		poi_button_element.addClass('btn btn-success');
		poi_button_element.attr({'id': 'Poi'});
		poi_button_element.append("Poi!!");
		Poi_element.append(poi_button_element);
		$("div#personal_control_1").append(Poi_element);
		var poi_role = hangout_POI_role[self.local.ownrole_number[0]];
		self.check_hangout_Poi_status();
		gapi.hangout.data.setValue(
			poi_role , ""
		);	

		self.check_hangout_Poi_status();
	});

	$("div#personal_control_1").on("click","button#Poi" ,function(){
		console.log("poi");
		$("div#personal_control_1").html("");
		Poi_cancel_element = $("<div/>");
		Poi_cancel_element.attr({'align': 'center'});
		Poi_cancel_element.append("click here to cancel poi<br>");

		var poi_cancel_button_element = $("<button/>");
		poi_cancel_button_element.attr({'id': 'Poi_cancel'});
		poi_cancel_button_element.addClass('btn btn-primary');
		poi_cancel_button_element.append("Cancel Poi!!");
		Poi_cancel_element.append(poi_cancel_button_element);
		$("div#personal_control_1").append(Poi_cancel_element);
		var poi_role = hangout_POI_role[self.local.ownrole_number[0]];
		self.check_hangout_Poi_status();
		gapi.hangout.data.setValue(
			poi_role , self.local.Participant_Id
		);		
		self.check_hangout_Poi_status();
	});


	self.local.current_personalfeed_ui = "Listener";
}

//personal feed drawing
Mixidea_Event.prototype.PrepareDom_forPersonalFeed_PoiSpeaker = function(){

	$("div#personal_control_1").html("");
	$("div#personal_control_2").html("");
	self.local.current_personalfeed_ui = "PoiSpeaker";
}
//personal feed drawing
Mixidea_Event.prototype.PrepareDom_forPersonalFeed_PoiListener_Audience = function(){
	var self = this;
	self.PrepareDom_for_ClosePoi();
	self.local.current_personalfeed_ui = "PoiListener_Audience";
}

//personal feed drawing
Mixidea_Event.prototype.PrepareDom_forPersonalFeed_PoiListener_speaker = function(){
	var self = this;
	self.PrepareDom_for_ClosePoi();
	self.local.current_personalfeed_ui = "PoiListener_speaker ";
}


Mixidea_Event.prototype.PrepareDom_for_ClosePoi = function(){

	$("div#personal_control_1").html("");
	
	var PoiFinish_elements = $("<div/>");
	PoiFinish_elements.attr({'align': 'center'});

	var PoiFinish_button_element = $("<button/>");
	PoiFinish_button_element.addClass('btn btn-primary');
	PoiFinish_button_element.attr({'id': 'PoiFinish'});
	PoiFinish_button_element.append("Close Poi Speech");

	PoiFinish_elements.append("<h3>Click to Close Poi speech</h3>");
	PoiFinish_elements.append(PoiFinish_button_element);
	$("div#personal_control_1").append(PoiFinish_elements);

	$("button#PoiFinish").click(function(){
		console.log("Close Poi speech");
		gapi.hangout.data.submitDelta({
		"CurrentPoiId": "",
		"CurrentPoiSpeakerName": ""
		});

		$("div#personal_control_1").html("");
		self.PrepareDom_forPersonalFeed_Speaker();
	})
}

//video feed
Mixidea_Event.prototype.DrawVideoFeed = function(){

	self = this;
	var hangout_shared_current_POI_speaker = gapi.hangout.data.getValue('CurrentPoiId');
	var hangout_shared_current_speaker = gapi.hangout.data.getValue('CurrentSpeakerId');

	if(hangout_shared_current_POI_speaker && self.hangout_id_exist(hangout_shared_current_POI_speaker)){
		self.feed = gapi.hangout.layout.createParticipantVideoFeed(hangout_shared_current_POI_speaker);
		self.local.current_speaker = hangout_shared_current_POI_speaker;
		var speech_mode = "Poi :";
		var speaker_name = gapi.hangout.data.getValue('CurrentPoiSpeakerName');
		$("div#speech_status").html("<strong><h3>" + speech_mode + speaker_name+ "</h3></strong>");


	}else if(hangout_shared_current_speaker  && self.hangout_id_exist(hangout_shared_current_speaker)){
			self.feed = gapi.hangout.layout.createParticipantVideoFeed(hangout_shared_current_speaker);
			self.local.current_speaker = hangout_shared_current_speaker;
			var speaker_role = gapi.hangout.data.getValue('CurrentSpeakerRole');
			var speaker_name = gapi.hangout.data.getValue('CurrentSpeakerName');
			$("div#speech_status").html("<strong><h3>" + speaker_role + ": " + speaker_name + "</h3></strong>");
	}else{
		self.feed = gapi.hangout.layout.getDefaultVideoFeed();
		self.local.current_speaker = null;
		$("div#speech_status").html("<strong><h2>Discussion mode</strong></h2>");
	}
	var height_title = $("div#event-title").height() ;
	var height_status = $("div#speech_status").height();
	var height_time = $("div#speech_time").height(); 
	console.log("height title = " + height_title); 
	console.log("height status = " + height_status); 
	console.log("height time = " + height_time);
	var height_all = height_title + height_status + height_time;
 	self.canvas.setVideoFeed(self.feed);
 	self.canvas.setWidth(400);
 	self.canvas.setPosition(10,height_all + 60);
 	self.canvas.setVisible(true);
}

Mixidea_Event.prototype.PrepareDom_for_chat_field = function(){

	var self = this;
	var chat_input_field_container = $("<div>");
	chat_input_field_container.attr({'id':'chat_input_field'});
	chat_input_field_container.attr({'style':'margin: 3px 2px 3px 2px'});
	chat_input_field_container.append("<h4>communication with partner</h4>");


	var chat_input_element =  $("<input/>");
	chat_input_element.attr({'type':'text'});
	chat_input_element.attr({'id':'chat_input_id'});
	chat_input_element.attr({'style':'width:98%'});
	chat_input_element.attr({'align':'center'});
	chat_input_element.attr({'placeholder':'message to partner'});

	var communication_button = $("<button/>");
	communication_button.attr({'id':"communication_with_partner"});
	communication_button.append("send message");

	var chat_display_container = $("<div/>");
	chat_display_container.attr({'id':"display_container"});
	chat_display_container.attr({'style':'border:1px solid; height:100px; overflow:scroll;'});

	chat_input_field_container.append(chat_input_element);
	chat_input_field_container.append(communication_button);

	$("div#chat_field").append(chat_input_field_container);
	$("div#chat_field").append(chat_display_container);


	$("button#communication_with_partner").click(function(){
		var message_to_partner = document.getElementById("chat_input_id").value;
		console.log(message_to_partner);
		gapi.hangout.data.sendMessage(message_to_partner);
		chat_display_container.append("you: " + message_to_partner);
		chat_display_container.append("<br>");
		chat_display_container.scrollTop(chat_display_container[0].scrollHeight)
	})
}


Mixidea_Event.prototype.init_setting_comoplete = function(){

	var self = this;

	var complete_count = gapi.hangout.data.getValue("complete_count");
	var num_count = Number(complete_count);
	if(isNaN(num_count)){
		num_count = self.local.complete_count;
	}
	num_count++;
	complete_count = String(num_count);
	gapi.hangout.data.setValue("complete_count", complete_count);
	self.local.init_complete=true;

}


Mixidea_Event.prototype.hangout_id_exist = function(in_id){
	self = this;
	var i = 0;
	for(i=0;i<self.participants_hangoutid_array.length; i++){
		if(self.participants_hangoutid_array[i].id == in_id){
			return true;
		}
	}
	return false;
}






Mixidea_Event.prototype.showTimer = function(){
	self.speech_duration++;
	var duration_mod = self.speech_duration % 60;
	var minutes = (self.speech_duration - duration_mod)/60;
	var second = duration_mod;
	var timer_msg = "time spent   " + minutes + "min " + second + "sec";
	$("div#speech_time").html(timer_msg);
}

Mixidea_Event.prototype.StopTimer = function(){
	self.speech_duration = 0;
	var i;
	for(i=0;i<self.speech_timer.length;i++){
		clearInterval(self.speech_timer[i]);
		console.log("speech timer is stopped with id = " + self.speech_timer[i]);
		self.speech_timer.splice(i,1);
	}
	$("div#speech_time").html("");
}

Mixidea_Event.prototype.UpdateMixideaStatus = function(){

	self = this;
	if(!self.local.init_complete){
		return;
	}


	var hangout_status = gapi.hangout.data.getState();
	console.log("hangout_status");
	console.log(JSON.stringify(hangout_status));

	var hangout_shared_current_POI_speaker = gapi.hangout.data.getValue('CurrentPoiId');
	var hangout_shared_current_speaker = gapi.hangout.data.getValue('CurrentSpeakerId');

//////update video feed//////

// PoiSpeakerを設定するべきで、現在Poiスピーカーが設定されていない
	if(hangout_shared_current_POI_speaker && self.hangout_id_exist(hangout_shared_current_POI_speaker)){
		if(hangout_shared_current_POI_speaker != self.local.current_speaker){
			self.feed = gapi.hangout.layout.createParticipantVideoFeed(hangout_shared_current_POI_speaker);
			self.local.current_speaker = hangout_shared_current_POI_speaker;
			self.canvas.setVideoFeed(self.feed);
			var speech_mode = "Poi :";
			var speaker_name = gapi.hangout.data.getValue('CurrentPoiSpeakerName');
			$("div#speech_status").html("<strong><h2>" + speech_mode + speaker_name+ "</strong></h2>");
		}
	}
//Speakerを設定するべきで、現在Speakerが設定されていない
	else if( hangout_shared_current_speaker  && self.hangout_id_exist(hangout_shared_current_speaker )){
		if( hangout_shared_current_speaker != self.local.current_speaker){
			self.feed = gapi.hangout.layout.createParticipantVideoFeed(hangout_shared_current_speaker);
			self.local.current_speaker = hangout_shared_current_speaker;
			self.canvas.setVideoFeed(self.feed);

			var speaker_role = gapi.hangout.data.getValue('CurrentSpeakerRole');
			var speaker_name = gapi.hangout.data.getValue('CurrentSpeakerName');
			$("div#speech_status").html("<strong><h2>" + speaker_role + ": " + speaker_name + "</strong></h2>");

			if(!self.speech_timer[0]){
				self.speech_timer.push(setInterval("self.showTimer()",1000));
				console.log("speech timer is set with id = " + self.speech_timer);
			}
		}
	}
//Discussioモード設定するべきで、現在Speakerが設定されている
	else{
		if(self.local.current_speaker){
			self.feed = gapi.hangout.layout.getDefaultVideoFeed();
			self.local.current_speaker = null;
			self.canvas.setVideoFeed(self.feed);
			$("div#speech_status").html("<strong><h2>Discussion mode</strong></h2>");

			self.StopTimer();
		}
	}

//////update personal ui //////
// PoiSpeakerを設定するべきで、Poiスピーカーがログインしている
	if(hangout_shared_current_POI_speaker && self.hangout_id_exist(hangout_shared_current_POI_speaker)){
		
		//POIスピーカーのとき
		if(hangout_shared_current_POI_speaker  == self.local.Participant_Id){
			if(self.local.current_personalfeed_ui != "POI_speaker"){
				self.PrepareDom_forPersonalFeed_PoiSpeaker();	
			}	
		//スピーカーのとき
		}else if(hangout_shared_current_speaker == self.local.Participant_Id){
			if(self.local.current_personalfeed_ui != "PoiListener_speaker"){
				self.PrepareDom_forPersonalFeed_PoiListener_speaker();
			}
		//その他のAudience
		}else{
			if(self.local.current_personalfeed_ui != "PoiListener_Audience"){
				self.PrepareDom_forPersonalFeed_PoiListener_Audience();	
			}
		}
	}

//Speakerを設定するべきで、現在Speakerがログインしている
	else if(hangout_shared_current_speaker  && self.hangout_id_exist(hangout_shared_current_speaker)){
		//スピーカーのとき
		if(hangout_shared_current_speaker == self.local.Participant_Id){
			if(self.local.current_personalfeed_ui != "Speaker"){
				self.PrepareDom_forPersonalFeed_Speaker();
			}
		//その他のAudience
		}else{
			if(self.local.current_personalfeed_ui != "Listener"){
				self.PrepareDom_forPersonalFeed_Listener();
			}
		}
	}
//Discussioモード設定するべきで、現在Speakerが設定されている
	else{
		if(self.local.current_personalfeed_ui != "Discussion"){
			self.PrepareDom_forPersonalFeed_Discussion();
		}
	}

/////////////////Take  POI//////////////////////
	if(self.local.current_speaker == hangout_shared_current_speaker && hangout_shared_current_speaker == self.local.Participant_Id){
		self.DrawPoiTakenField_ForSpeaker();
	}

//////////////update event title/////
	var current_title_count = Number(gapi.hangout.data.getValue('title_count'));
	if (self.title_count != current_title_count){

		self.obj.event.fetch().then(function(event_obj){
			self.obj.event = event_obj;
			self.Display_event_title_default();
			if(current_title_count){
				self.title_count = current_title_count;
			}
		});
	}

	/////////initialization of the participant has been finished ///////////

	var current_complete_count = Number(gapi.hangout.data.getValue("complete_count"));
	if(current_complete_count && (self.local.complete_count != current_complete_count)){
		self.prepareDOM_ParticipantField_NA();
		self.local.complete_count = current_complete_count;
		self.Get_group_member_id();
	}

	///////// refresh the user info from the server /////////

	var current_refresh_count = Number(gapi.hangout.data.getValue("refresh_count"));
		if(current_refresh_count && (self.local.refresh_count != current_refresh_count )){
			self.Check_OwnRole_and_Share();
			self.RetrieveParticipantsData_on_Event_NA().then(function(){
				//wait one seconds and update the participant field
				setTimeout("self.prepareDOM_ParticipantField_NA()",1000);
				setTimeout("self.Get_group_member_id()",1000);
				self.local.refresh_count = current_refresh_count;
			});
		}
}


//change

Mixidea_Event.prototype.ParticipantsChanged = function(changed_participants){

	self = this;
	console.log("participant changed");
	self.participants_hangoutid_array = changed_participants.participants;

	if(!self.participants_hangoutid_array ){ return;}

	for(i=0;i<self.participants_hangoutid_array.length; i++){
		console.log(self.participants_hangoutid_array[i].id);
	}
	//update participant field

	self.Check_OwnRole_and_Share();
	self.RetrieveParticipantsData_on_Event_NA().then(function(){
		self.prepareDOM_ParticipantField_NA();
	});

	/////group member update
	self.Get_group_member_id();

}

Mixidea_Event.prototype.receive_message = function(received_message){

	self = this;
	var partner = false;
	console.log("message is received");
	console.log(received_message.message);
	console.log(received_message.senderId);

	var chat_display_container = document.getElementById("display_container");
	console.log(received_message.message);

	for(i=0;i<self.group_partner_hangout_id.length;i++){
		if(self.group_partner_hangout_id[i] == received_message.senderId){
			partner = true;
		}
	}
	
	if(partner){
		$("#display_container").append("partner: " + received_message.message);
		$("#display_container").append("<br>");
		$("#display_container").scrollTop($("#display_container")[0].scrollHeight);
	}

}

function init() {
  gapi.hangout.onApiReady.add(function(e){
    console.log("hangout api ready");
    if(e.isApiReady){
    	var mixidea_object = new Mixidea_Event();
    	gapi.hangout.data.onStateChanged.add(function(event) {
    	  	mixidea_object.UpdateMixideaStatus(event);
        });

        gapi.hangout.onParticipantsChanged.add(function(participant_change) {
          mixidea_object.ParticipantsChanged(participant_change);
        });

        gapi.hangout.data.onMessageReceived.add(function(received_message) {
          mixidea_object.receive_message(received_message);
        });

    }
  });
}

