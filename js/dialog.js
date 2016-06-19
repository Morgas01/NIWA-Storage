(function(µ,SMOD,GMOD,HMOD,SC){

	//SC=SC({})
	var defaultButtons=[function Ok (dialog){dialog.remove()}];
	var dialog=function (contentHTML,buttons)
	{
		buttons=buttons||defaultButtons;
		
		var dialog=document.createElement("div");
		dialog.classList.add("dialog");
		
		var content=document.createElement("div");
		content.classList.add("content");
		content.innerHTML=contentHTML;
		
		var actions=document.createElement("div");
		actions.classList.add("actions");
		actions.innerHTML=buttons.map((action,i)=>String.raw`
			<button data-action="${action.name}" data-index="${i}">${action.name}</button>
		`).join("");
		actions.addEventListener("click",function(event)
		{
			if(event.target.dataset.action)
			{
				event.stopPropagation();
				event.preventDefault();
				buttons[event.target.dataset.index](dialog,event);
			}
		})
		
		content.appendChild(actions);
		dialog.appendChild(content);
		
		document.body.appendChild(dialog);
		
		return dialog;
	}
	SMOD("ui.Dialog",dialog);
	
})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);