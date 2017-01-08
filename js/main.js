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
var main = $('#main');

// form data
var sex, age, height, weight, af, lbToLose;

var lossgainWeeklyCal;
var eer;
var weightLoss;

// meal maker vars
var dailyMacroData;
var numMeals;
var foods

$.ajax({
	url: "data/foods.json",
	success: function(data){
		foods = JSON.parse(data);
	}
});

var amountOfMeals;
var dayProtein, dayFat, dayCarb;
var mealbtn;

// button events
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

	$.ajax({
		url: 'breakdown.html',
		dataType: 'html',
		success: function(data){
			// console.log(data)
			$('#main').html(data)
			displayBreakdown(eer, lossgainWeeklyCal);

			mealbtn = $('#mealbtn')
			mealbtn.bind('click', function(e){
				e.preventDefault();
				amountOfMeals = $('#mealnum').val();
				loadMealsHTML()
			});
		}
	});
})

function getRndInt(min, max) {
	// generate random int, inclusive of <min> and <max>
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function calculateEER(sex, age, height, weight, af) {
	// calculates the Estimated Energy Requrement/Total Daily Energy Expenditure.
	var sexMods = modifers[sex];
	// console.log(sexMods)
	var eer = sexMods.mod + (sexMods.weight /*['weight']*/ * weight) + (sexMods.height * height) - (sexMods.age * age);
	return Math.round(eer * af)
}

function calculateLossGain(EER, lbToLose){
	return (EER + (lbToLose * 3500)/7)
}

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
}

function spanH(item) {
	// for wrapping important numbers in a span.highlight
	return "<span class='highlight'>" + item + "</span>"
}

function displayBreakdown(EER, lossgainWeeklyCal) {
	// displays the data broken down into macro requirement and calorie requirement areas
	main.css({'display': "block"}); // shows the breakdown area after form is submited
	result.html('Calorie/Macronutrient Breakdown');

	// CALORIE BREAKDOWN
	// maintinance calories
	main.find('.maintinance-cal p').html('To maintain your current weight, your\
		daily caloric intake should be ' + spanH(EER) + ' calories.')
	// loss/gain calories
	var subheading;
	var text;
	var lossgain = $('#lossgain option:selected').text();

	if (weightLoss == true) {
		subheading = 'Lose ' + lossgain.slice(1);
	} else if (weightLoss == false) {
		subheading = 'Gain ' + lossgain.slice(1);
	} else {
		subheading = 'Maintain weight';
	}
	text = "To " + subheading + ' your daily caloric intake should be ' + spanH(lossgainWeeklyCal) + ' calories.'

	main.find('.lossgain-cal h4').html(subheading)
	main.find('.lossgain-cal p').html(text)
	
	// MACRO BREAKDOWN
	dailyMacroData = calculateMacroData(weight, lossgainWeeklyCal)
	for ( var i = 0; i < $('.macro').length; i++) {
		// macroDivClass represents class text e.g. "protein", "carb" for lookup into macroData object
		var macroDivClass = $('.macro').eq(i).attr('class').split(' ')[0] 

		var g = dailyMacroData[macroDivClass]['grams']
		var p = dailyMacroData[macroDivClass]['percent']
		var c = dailyMacroData[macroDivClass]['calories']
		var r = dailyMacroData[macroDivClass]['recommendation']

		// breakdown text template
		// var text = "Your daily "+ macroDivClass +" intake should be " + g + "g (" + c + " cal) this is " + p + "% of your total caloric requirement. " + r
		var text = "Your daily "+ macroDivClass +" intake should be " + spanH(g) + "g (" + spanH(c) + " cal) this is " + spanH(p) + "% of your total caloric requirement. " + r
		// gets the p element to display the text
		$('.' + macroDivClass + ' p').html(text)
	};

}

function loadMealsHTML(){
	$.ajax({
		url: "meals.html",
		dataType: "html",
		success: function(data){
			$('#main').html(data);
			console.log('hello');
		}
	}).then(function(){
		$('#demo').html(amountOfMeals);
	})
}

function makeDayMeals(amountOfMeals, dayProtein, dayFat, dayCarb){
	// version 1: all meals have same amount of calories except the last one is modified for remaining calories.
	// version 2: divide equally by number of meals, next one you divide again from numebr of meals -1 and so on till you reach 2 and then make meals from those.
	var i = 0;
	var meals = [];
	for (; i < amountOfMeals; i++){
		/* currentMeal = {
			"protein source": {
				"name": "something",
				"protein": 0,
				"fat": 0,
				"carb": 0
			},
			"fat source": {
				"name": "something",
				"protein": 0,
				"fat": 0,
				"carb": 0
			},
			"carb source": {
				"name": "something",
				"protein": 0,
				"fat": 0,
				"carb": 0
			},
			"fruitsandveg": {
				"name": "something",
				"protein": 0,
				"fat": 0,
				"carb": 0
			}
			"calories": 0
		} */
		var currentMeal = makeMeal(args);

		meals.push(currentMeal);
	};
}

function calculatePortionMass(foodData, primaryMacro, MassNeeded){
	// calculates the portion mass of the food
	// multiply by 100 b/c data in foods.json is per 100g of the food
	return (MassNeeded * 100) / foodData[primaryMacro];
}

function primaryMacroSource(foodName, foodData, portionMass){
	// done
	foodSource = {
		"name": foodName
	};
	foodSource["protein"] = Math.floor((portionMass * foodData["protein"]) / 100);
	foodSource["fat"] = Math.floor((portionMass * foodData["fat"]) / 100);
	foodSource["carb"] = Math.floor((portionMass * foodData["carb"]) / 100);
	foodSource["foodcals"] = (foodSource["protein"] * 4) + (foodSource["fat"] * 9) + (foodSource["carb"] * 4)
	return foodSource;
};

function makeMeal(mealProteinMass, mealFatMass, mealCarbMass) {
	// done
	var mealProtCount, mealFatCount, mealCarbCount;
	// var meal = {};
	var meal = {
			"protein source": {},
			"fat source": {},
			"carb source": {},
			"fruitsandveg": {}
		};

	var protSourceItems = foods["protein source"];
	var protSourceFood = protSourceItems[getRndInt(0, protSourceItems.length-1)];

	var fatSourceItems = foods["fat source"];
	var fatSourceFood = fatSourceItems[getRndInt(0, fatSourceItems.length-1)];

	var carbSourceItems = foods["carb source"];
	var carbSourceFood = carbSourceItems[getRndInt(0, carbSourceItems.length-1)];

	var vegSourceItems = foods["fruitsandveg"];
	var vegSourceFood = vegSourceItems[getRndInt(0, vegSourceItems.length-1)];

	proteinPortionMass = calculatePortionMass(
										foods["foods"][protSourceFood],
										"protein",
										mealProteinMass
									);
	meal["protein source"] = primaryMacroSource(protSourceFood, foods["foods"][protSourceFood], proteinPortionMass);

	fatPortionMass = calculatePortionMass(
										foods["foods"][fatSourceFood],
										"fat",
										mealFatMass
									);
	meal["fat source"] = primaryMacroSource(fatSourceFood, foods["foods"][fatSourceFood], fatPortionMass);

	carbPortionMass = calculatePortionMass(
										foods["foods"][carbSourceFood],
										"carb",
										mealCarbMass
									)/2;
	meal["carb source"] = primaryMacroSource(carbSourceFood, foods["foods"][carbSourceFood], carbPortionMass);

	vegPortionMass = carbPortionMass/2
	meal["fruitsandveg"] = primaryMacroSource(vegSourceFood, foods["foods"][vegSourceFood], vegPortionMass);

	// now update the total day macros
	for (var item in meal){
		dailyMacroData["protein"]["grams"] -= meal[item]["protein"]
		dailyMacroData["fat"]["grams"] -= meal[item]["fat"]
		dailyMacroData["carb"]["grams"] -= meal[item]["carb"]
		dailyMacroData["carb"]["grams"] -= meal[item]["carb"]
	};

	return meal;
}