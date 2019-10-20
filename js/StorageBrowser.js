(function(µ,SMOD,GMOD,HMOD,SC){

	let Dialog=GMOD("gui.Dialog");

	SC=SC({
		rs:"rescope",
		Tree:"gui.Tree",
		fuzzySearch:"fuzzySearch",
		unit:"metricUnit",
		PathMenu:"gui.PathMenu",
		Table:"gui.OrganizedTable",
		TableConfig:"gui.TableConfig.Select",
		register:"register",
		request:"request",
		encase:"encase",
		action:"gui.actionize",
		Organizer:"Organizer"
	});

	let StorageBrowser=µ.Class({
		constructor:function(data)
		{
			SC.rs.all(this,["_onTreeDblClick","_onContentDblClick"]);

			this.content=document.createElement("div");
			this.content.innerHTML=`
				<input type="text" data-action="search">
				<div class="pathContent"></div>
				<button data-action="close">❌</button>
				<div class="splitter"></div>
				<div class="treeWrapper"></div>
				<div class="actions">
					<button data-action="copy" title="copy"></button>
					<button data-action="move" title="move"></button>
					<button data-action="addSelection" title="addSelection" accesskey="s"></button>
					<div class="showSelectionWrapper">
						<button class="showSelection menu" title="showSelection menu" data-count="0"></button>
						<ul class="menu"></ul>
					</div>
					<button data-action="clearSelection" title="clearSelection"></button>
				</div>
			`;

			this.data=[];

			this.content.classList.add("StorageBrowser");

			this.search=this.content.querySelector("input[data-action='search']");
			this.pathContent=this.content.querySelector(".pathContent");

			this.tree=new SC.Tree([],(element,entry)=>
			{
				element.textContent=this.getStructureEntryName(entry);
				element.classList.add("Structure");
				element.parentNode.dataset.type=entry.type;
			});
			this.content.querySelector(".treeWrapper").appendChild(this.tree.element);
			this.tree.element.addEventListener("dblclick",this._onTreeDblClick)

			this.pathMenu=new SC.PathMenu([],(e,d)=>e.textContent=this.getStructureEntryName(d),{
				menuParam:{filter:d=>d.type==="Directory"}
			});
			this.content.appendChild(this.pathMenu.element);
			this.pathMenu.addEventListener("pathChange",this,this._onPathSelect);

			let tableConfig=new SC.TableConfig([
				{
					name:"Name",
					styleClass:"name",
					fn:(c,e)=>
					{
						c.textContent=this.getStructureEntryName(e);
						c.dataset.type=c.parentNode.dataset.type=e.type;
					}
				},
				{
					name:"size",
					getter:e=>SC.unit.to(e.size,{base:"B"})
				},
				{
					name:"last modified",
					getter:e=>
					{
						let date=new Date(e.mtime);
						return date.toLocaleString(undefined,{hour:"2-digit",minute:"2-digit",second:"2-digit"})+" "+date.toLocaleString(undefined,{year:"numeric",month:"2-digit",day:"2-digit"});
					}
				}
			],{noInput:true,control:true})
			this.table=new SC.Table(tableConfig);
			this.pathContent.appendChild(this.table.getTable());
			this.pathContent.addEventListener("dblclick",this._onContentDblClick);

			this.selectedButton=this.content.querySelector(".showSelection");
			this.selectedMenu=this.selectedButton.nextElementSibling;
			this.selectedStructures=new Set();

			SC.action(this.actions, this.content,this,["click","change"]);
		},
		setData(data)
		{
			this.data=SC.encase(data);
			let structures=data.map(r=>r.structure);
			this.tree.clear().add(structures);
			this.pathMenu.setData(structures);
			this.pathMenu.setActive(this.pathMenu.getActive());
		},
		getStructureEntryName(entry)
		{
			let displayName=entry.name;
			if(entry.parent==null)
			{
				let root=this._getStorage(entry);
				displayName=root.name+" ("+displayName+")";
			}
			return displayName;
		},
		getStructureEntryPath(entry)
		{
			let path=entry.getPath();
			let root=this._getStorage(entry);
			path[0]=root.name+" ("+path[0]+")";
			return path.join("/");
		},
		_onTreeDblClick(event)
		{
			let target=event.target;
			let directory=null;
			while(target&&!(directory=this.tree.change(target))) target=target.parentNode;

			if(directory==null) return ;

			if(directory.type==="File") directory=directory.parent;
			this.pathMenu.setActive(directory);
		},
		_onPathSelect(event)
		{
			this.table.clear();
			let data;
			if(event.active) data=Array.from(event.active.children);
			else data=this.data.map(r=>r.structure);
			data.sort(SC.Organizer.attributeSort(["type","name"]))
			this.table.add(data);
		},
		_onContentDblClick(event)
		{
			let target=event.target;
			let directory=null;
			while(target&&!(directory=this.table.change(target))) target=target.parentNode;

			if(directory!=null&&directory.type==="Directory") this.pathMenu.setActive(directory);
		},
		_getStorage(structure)
		{
			let top=structure;
			while(top.parent) top=top.parent;
			return this.data.find(root=>root.structure==top)
		},
		actions:{
			search(event,input)
			{
				if(input.value)
				{
					let term=input.value.trim();
					let scorers=[SC.fuzzySearch.scoreFunctions.string.words(term.match(/(:?\b[a-z]|[A-Z])[a-z]*/g)||term.split(/\s+/))];
					filterFn=entry=>SC.fuzzySearch.score(entry.name,scorers)>0.3;
					this.tree.filter(filterFn);
					this.tree.expandRoots(true);
				}
				else
				{
					this.tree.expandRoots(false);
					this.tree.filter(null);
				}
			},
			addSelection(event)
			{
				this.table.getSelected().forEach(this.selectedStructures.add,this.selectedStructures);
				this.selectedButton.dataset.count=this.selectedStructures.size;
				this.selectedMenu.innerHTML=Array.from(this.selectedStructures)
				.map(s=>`<li>${this.getStructureEntryPath(s)}</li>`)
				.join("\n");
			},
			clearSelection()
			{
				this.selectedStructures.clear();
				this.selectedButton.dataset.count=0;
				this.selectedMenu.innerHTML="";
			},
			copy()
			{
				let target=this.pathMenu.getActive();
				if(target==null) return;

				let data={
					structures:SC.register(1,()=>[]),
					target:target.getPath(),
					targetStorage:this._getStorage(target).name
				};
				this.selectedStructures.forEach(s=>
				{
					data.structures[this._getStorage(s).name].push(s.getPath());
				});
				SC.request({
					url:"rest/actions/copy",
					data:JSON.stringify(data)
				}).then(µ.logger.info,µ.logger.error);
			}
		}
	});

	SMOD("StorageBrowser",StorageBrowser);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);