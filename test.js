var x = document.getElementById('demo');
// x.innerHTML = test

btn = document.getElementById('btn');
// console.log(btn);
btn.addEventListener('click', test)

function test(){
	x.innerHTML = 'TESTING'	
}