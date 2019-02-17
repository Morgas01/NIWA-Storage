(function(µ,SMOD,GMOD,HMOD,SC){

	SC=SC({
		Table:"gui.Table",
		cDate:"converter/date",
		dateFormat:"date/format"
	});

	let element=document.createElement("DIV");
	element.classList.add("jobList");

	window.addEventListener("beforeunload",()=>jobList.eventSource&&jobList.eventSource.close());

	let tableColumns=[
		{
			fn:function state(element,data)
			{
				element.dataset.state=data.state
			},
			styleClass:"state"
		},
		{
			fn:function title(element,data)
			{
				element.textContent=data.name;
			},
			styleClass:"title"
		},
		{
			fn:function messages(element,data)
			{
				let progress=element.children[0];
				if(!progress)
				{
					progress=document.createElement("PROGRESS");
					element.appendChild(progress);
				}
				progress.max=data.progressMax;
				progress.value=data.progress;

				let wrapper=element.children[1];
				if(!wrapper)
				{
					wrapper=document.createElement("DIV");
					wrapper.classList.add("messages");
					element.appendChild(wrapper);
				}
				for(let i=wrapper.children.length;i<data.messages.length;i++)
				{
					let message=data.messages[i];

					let entry=document.createElement("DIV");
					entry.classList.add("message");

					let text=document.createElement("SPAN");
					text.classList.add("text");
					if(typeof message.message === "string")
					{
						text.textContent=message.message;
					}
					else
					{
						text.textContent=JSON.stringify(message.message);
					}
					entry.appendChild(text);

					let time=document.createElement("SPAN");
					time.classList.add("time");
					time.textContent=SC.dateFormat(SC.cDate.from(message.time),SC.dateFormat.exactTime);
					entry.appendChild(time);

					wrapper.insertBefore(entry,wrapper.firstChild);
				}
			}
		},
	];

	let jobList={
		element:element,
		table:null,
		connect()
		{
			if(!jobList.table)
			{
				let table=jobList.table=new SC.Table();
				let config=table.tableConfig;
				tableColumns.forEach(config.addColumn,config);
				jobList.element.appendChild(table.getTable());
			}
			jobList.eventSource=new EventSource("event/job");
			for(let [name,fn] of Object.entries(jobList.events))
			{
				jobList.eventSource.addEventListener(name,fn);
			}
		},
		events:{
			ping:µ.logger.debug,
			init(event)
			{
				let data=JSON.parse(event.data);
				jobList.table.add(data);
			},
			add(event)
			{
				let data=JSON.parse(event.data);
				jobList.table.add(data);
			},
			start(event)
			{
				let data=JSON.parse(event.data);
				jobList.update(data);
			},
			message(event)
			{
				let data=JSON.parse(event.data);
				jobList.update(data);
			},
			end(event)
			{
				let data=JSON.parse(event.data);
				jobList.update(data);
			},
			error(error)
			{
				if(jobList.eventSource.readyState==EventSource.CLOSED)
				{
					//TODO alert("connection lost");
					µ.logger.warn("no connection to job events");
				}
				setTimeout(jobList.connect,5E3);
			},
		},
		update(jobJson)
		{
			let toupdate=jobList.table.data.find(d=>d.ID===jobJson.ID);
			Object.assign(toupdate,jobJson);
			jobList.table.update(toupdate);
		}
	};

	SMOD("jobList",jobList);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);