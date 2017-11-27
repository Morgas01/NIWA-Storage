(function(µ,SMOD,GMOD,HMOD,SC){

	let Dialog=GMOD("gui.Dialog");

	SC=SC({
		Tree:"gui.Tree",
		fuzzySearch:"fuzzySearch"
	});

	let StorageBrowser=µ.Class(Dialog,{
		constructor:function(data)
		{
			this.mega(`
				<input type="text">
				<div class="treeContainer"></div>
				<button data-action="close">Close</button>
			`,{
				modal:true,
			});

			this.content.classList.add("StorageBrowser");

			this.input=this.content.children[0];
			let treeContainer=this.content.children[1];

			data=data.map(s=>{
				let dummy=Object.create(s.structure);
				dummy.name=s.name;
				return dummy;
			});

			this.tree=new SC.Tree(data,function(element,entry)
			{
				element.textContent=entry.name;
				element.parentNode.dataset.type=entry.type;
			});
			treeContainer.appendChild(this.tree.element);

			this.input.addEventListener("change",()=>this.updateFilter());
		},
		updateFilter:function()
		{
			if(this.input.value)
			{
				let term=this.input.value.trim();
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

		}
	});

	SMOD("StorageBrowser",StorageBrowser);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);