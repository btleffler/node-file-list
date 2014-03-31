// Determine if the file is hidden in Windows systems

var fs = new ActiveXObject ("Scripting.FileSystemObject"),
	name = WScript.Arguments.item (0),
	file;

try{
	file = fs.getFile(name);
}catch (e){
	file = fs.getFolder(name);
}

// Hidden?
WScript.echo(!!(file.attributes & 2));