(function(µ,SMOD,GMOD,HMOD,SC){

	let Dialog=GMOD("gui.Dialog");

	SC=SC({
		Structure:"Structure",
		TableConfig:"gui.TableConfig.Select",
		Table:"gui.Table",
		addStorageDialog:"addStorageDialog",
		Storage:"Storage",
		request:"request",
		updateDialog:"updateDialog"
	});

	let StorageConfigDialog=µ.Class(Dialog,{
		constructor:function(data)
		{
			this.data=data;
			this.mega(
			`
				<div class="buttons">
					<div data-action="add">add</div>
					<div data-action="edit">edit</div>
					<div data-action="update">update</div>
					<div data-action="remove">remove</div>
				</div>
				<div class="storages"></div>

				<div data-action="close">close</div>
			`
			,{
				actions:this.actions
			});
			this.content.classList.add("StorageConfigDialog");

			this.table=new SC.Table(new SC.TableConfig(["name","path"],{radioName:"storageSelect",noInput:true}));
			this.table.add(this.data);
			this.content.querySelector(".storages").appendChild(this.table.getTable());
		},
		actions:{
			add()
			{
				SC.addStorageDialog().then(async ()=>
				{
					this.data=(await request.json("rest/storage/list")).map(SC.Storage.fromJSON);
					this.table.clear();
					this.table.add(this.data);
				});
			},
            async edit()
            {
            	if(this.table.getSelected().length===0) return;
            	alert("TODO");
            },
            async update()
            {
            	if(this.table.getSelected().length===0) return;

				let name=this.table.getSelected()[0].name;
				SC.updateDialog(name).then(async ()=>
				{
					this.data=(await request.json("rest/storage/list")).map(SC.Storage.fromJSON);
					this.table.clear();
					this.table.add(this.data);
				});
            },
            async remove()
            {
            	if(this.table.getSelected().length===0) return;
            	alert("TODO");
            },
		}
	});

	SMOD("StorageConfigDialog",StorageConfigDialog)

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);