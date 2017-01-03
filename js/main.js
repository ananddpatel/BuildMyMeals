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

var tdeeForm = $('#TDEEform');
var btn = $('#btn');
var result = $('#title');
var breakdownSection = $('#breakdown');

// form data
var sex, age, height, weight, af, lbToLose;

var lossgainWeeklyCal;
var eer;
var weightLoss;

tdeeForm.submit(function (e) {
	e.preventDefault()

	sex = $('input[name=sex]:checked').val();
	// console.log(sex);
	age = $('input[name=age]').val();
	// console.log(age * 2, typeof age);
	height = $('input[name=height]').val();
	// console.log(height * 2, typeof height);
	weight = $('input[name=weight]').val()
	// console.log(weight * 2, typeof weight);
	af = $('#activity').val()
	// console.log(af * 2, typeof af);
	lbToLose = $('#lossgain').val()
	if (lbToLose < 0) {
		weightLoss = true;
	} else if (lbToLose > 0) {
		weightLoss = false;
	};

	// calulations
	eer = calculateEER(sex, age, height, weight, af);
	lossgainWeeklyCal = calculateLossGain(eer, lbToLose);

	displayBreakdown(eer, lossgainWeeklyCal);
	$('#tdeeformsection').css({'display':'none'})
});


function calculateEER(sex, age, height, weight, af) {
	// calculates the Estimated Energy Requrement/Total Daily Energy Expenditure.
	var sexMods = modifers[sex];
	// console.log(sexMods)
	var eer = sexMods.mod + (sexMods.weight /*['weight']*/ * weight) + (sexMods.height * height) - (sexMods.age * age);
	return Math.round(eer * af)
};	

function calculateLossGain(EER, lbToLose){
	return (EER + (lbToLose * 3500)/7)
};

function calculateMacroData(userWeight, totalCalories){
	var proteinWeight = Math.round((userWeight * 0.9));
	var fatWeight = Math.round((userWeight * 0.45));
	var carbWeight = Math.round(((totalCalories - (proteinWeight * 4 + fatWeight * 9))/4));
	var macroData = {
		protein: {
			grams: proteinWeight,
			percent: ((proteinWeight*4)/totalCalories * 100).toFixed(1),
			calories: proteinWeight * 4,
			recommendation: "It's recommended that you take 0.45 - 1g of protein/lb body weight per day."
		},
		fat: {
			grams: fatWeight,
			percent: ((fatWeight*9)/totalCalories * 100).toFixed(1),
			calories: fatWeight * 9,
			recommendation: "It's recommended that you take 0.4 - 0.5g of fat/lb body weight per day."
		},
		carb: {
			grams: carbWeight,
			percent: ((carbWeight*4)/totalCalories * 100).toFixed(1),
			calories: carbWeight * 4,
			recommendation: "This is the rest of your caloric requirement."
		}
	};
	return macroData;
};

function displayBreakdown(EER, lossgainWeeklyCal) {
	// displays the data broken down into macro requirement and calorie requirement areas
	breakdownSection.css({'display': "block"}); // shows the breakdown area after form is submited
	result.text('Calorie/Macronutrient Breakdown');

	// CALORIE BREAKDOWN
	// maintinance calories
	breakdownSection.find('.maintinance-cal p').text('To maintain your current weight, your\
		daily caloric intake should be ' + EER + ' calories.')
	// loss/gain calories
	var subheading;
	var text;
	var lossgain = $('#lossgain option:selected').text();

	if (weightLoss == true) {
		subheading = 'Lose ' + lossgain.slice(1);
	} else if (weightLoss == false) {
		subheading = 'Gain ' + lossgain.slice(1);
	} else {
		subheading = 'Maintain weight'
	}
	text = "To " + subheading + ' your daily caloric intake should be ' + lossgainWeeklyCal + ' calories.'

	breakdownSection.find('.lossgain-cal h4').text(subheading)
	breakdownSection.find('.lossgain-cal p').text(text)
	
	// MACRO BREAKDOWN
	var macroData = calculateMacroData(weight, lossgainWeeklyCal)
	for ( var i = 0; i < $('.macro').length; i++) {
		// macroDivClass represents class text e.g. "protein", "carb" for lookup into macroData object
		var macroDivClass = $('.macro').eq(i).attr('class').split(' ')[0] 

		var g = macroData[macroDivClass]['grams']
		var p = macroData[macroDivClass]['percent']
		var c = macroData[macroDivClass]['calories']
		var r = macroData[macroDivClass]['recommendation']

		// breakdown text template
		var text = "Your daily "+ macroDivClass +" intake should be " + g + " grams (" + c + " cal) this is " + p + "% of your total caloric requirement. " + r
		// gets the p element to display the text
		$('.' + macroDivClass + ' p').text(text)
	};

};