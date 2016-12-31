var modifers = {
	"Male": {
		mod: 66,
		weight: 6.23,
		height: 12.7,
		age: 6.8
	},
	Female:{
		mod: 655,
		weight: 4.35,
		height: 4.7,
		age: 4.7
	},
};

var tdeeForm = document.forms[0];
var btn = document.getElementById('btn');
var result = document.getElementById('result');

tdeeForm.addEventListener('submit', function (e) {
	e.preventDefault()

	var sex = tdeeForm.sex.value;
	var age = Number(tdeeForm.age.value);
	var height = Number((tdeeForm.feet.value * 12)) + Number(tdeeForm.inches.value);
	var weight = Number(tdeeForm.weight.value);
	var af = tdeeForm.activity.value;

	displayEER(calculateEER(sex, age, height, weight, af));
});


function calculateEER(sex, age, height, weight, af) {
	// calculates the Estimated Energy Requrement/Total Daily Energy Expenditure.

	var sexMods = modifers[sex];
	console.log(sexMods)
	var eer = sexMods.mod + (sexMods['weight'] * weight) + (sexMods.height * height) - (sexMods.age * age);
	return Math.round(eer * af)
};	

function displayEER(resultToDisplay) {
	// displays the caloric intake
	result.innerHTML = resultToDisplay
}
