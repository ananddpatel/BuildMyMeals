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
var heading = $('#title');
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
		// for some reason github pages doesnt need to parse the data 
		// but on dev server it does

		// for dev server
		// foods = JSON.parse(data);

		// for github pages erver server
		foods = data;
	}
});

var amountOfMeals;
var dayProtein, dayFat, dayCarb;
var mealbtn;

// button events
tdeeForm.submit(function (e) {
	e.preventDefault()

	sex = $('input[name=sex]:checked').val();
	age = $('input[name=age]').val();
	height = $('input[name=height]').val();
	weight = $('input[name=weight]').val()
	af = $('#activity').val()
	lbToLose = $('#lossgain').val()

	if (lbToLose < 0) {
		weightLoss = true;
	} else if (lbToLose > 0) {
		weightLoss = false;
	};

	// calulations
	eer = calculateEER(sex, age, height, weight, af);
	lossgainWeeklyCal = calculateLossGain(eer, lbToLose);
	loadBreakdownHTML();
})

function getRndInt(min, max) {
	// generate random int, inclusive of <min> and <max>
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function loadBreakdownHTML(){
	$.ajax({
		url: 'breakdown.html',
		dataType: 'html',
		success: function(data){
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
}

function calculateEER(sex, age, height, weight, af) {
	// calculates the Estimated Energy Requrement/Total Daily Energy Expenditure.
	var sexMods = modifers[sex];
	var eer = sexMods.mod + (sexMods.weight * weight) + (sexMods.height * height) - (sexMods.age * age);
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
	heading.html('Calorie/Macronutrient Breakdown');

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
		}
	}).then(function(){
		var p = dailyMacroData.protein.grams;
		var f = dailyMacroData.fat.grams;
		var c = dailyMacroData.carb.grams;
		var allMeals = makeDayMeals(amountOfMeals, p, f, c);
		// console.log(allMeals)
		displayMeals(allMeals);
	})
}

function makeDayMeals(amountOfMeals, dayProtein, dayFat, dayCarb){
	// version 1: all meals have same amount of calories except the last one is modified for remaining calories.
	// version 2: divide equally by number of meals, next one you divide again from numebr of meals -1 and so on till you reach 2 and then make meals from those.
	var i = 0;
	var meals = [];

	var mealProtein = dayProtein/amountOfMeals
	var mealFat = dayFat/amountOfMeals
	var mealCarb = dayCarb/amountOfMeals
	for (; i < amountOfMeals-1; i++){
		var currentMeal = makeMeal(mealProtein, mealFat, mealCarb);
		meals.push(currentMeal);
	};

	var lastMealProtein = dailyMacroData["protein"]["grams"];
	var lastMealFat = dailyMacroData["fat"]["grams"];
	var lastMealCarb = dailyMacroData["carb"]["grams"];

	var lastMeal = makeMeal(lastMealProtein, lastMealFat, lastMealCarb);
	meals.push(lastMeal);

	return meals;
}

function calculatePortionMass(foodData, primaryMacro, MassNeeded){
	// calculates the portion mass of the food
	// multiply by 100 b/c data in foods.json is per 100g of the food
	return (MassNeeded * 100) / foodData[primaryMacro];
}

function primaryMacroSource(foodName, foodData, portionMass){
	foodSource = {
		"name": foodName
	};
	foodSource["protein"] = Math.floor((portionMass * foodData["protein"]) / 100);
	foodSource["fat"] = Math.floor((portionMass * foodData["fat"]) / 100);
	foodSource["carb"] = Math.floor((portionMass * foodData["carb"]) / 100);
	foodSource["foodcals"] = (foodSource["protein"] * 4) + (foodSource["fat"] * 9) + (foodSource["carb"] * 4),
	foodSource["portionmass"] = Math.floor(portionMass);
	return foodSource;
};

function makeMeal(mealProteinMass, mealFatMass, mealCarbMass) {
	var mealProtCount, mealFatCount, mealCarbCount;
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
		dailyMacroData["carb"]["grams"] -= meal[item]["carb"] // for carb source
		dailyMacroData["carb"]["grams"] -= meal[item]["carb"] //for fruits and veg
	};

	return meal;
}

function displayMeals(meals){
	heading.text('Meals');
	var i = 0;
	var m = $('#main');
	for (; i < meals.length; i++){
		m.append($('<h4>').text('Meal '+(i+1)));
		var meal = meals[i];

		var row = $('<div>').attr('class', 'row');

		// for the food pics and portion
		for (var group in meal) {
			var food = $('<div>').attr('class', 'col-md-2');
			var foodPic = $('<img>').attr('src', '/img/'+meal[group]["name"]+'.jpg');
			// food name: amount
			var foodData = $('<strong>').text(meal[group]["name"]+': '+meal[group]["portionmass"]+'g');
			food.append(foodPic, foodData);
			row.append(food);
		}

		var pGet = meal["protein source"];
		var fGet = meal["fat source"];
		var cGet = meal["carb source"];
		var vGet = meal["fruitsandveg"];

		var p = pGet.protein + fGet.protein + cGet.protein + vGet.protein;
		var f = pGet.fat + fGet.fat + cGet.fat + vGet.fat;
		var c = pGet.carb + fGet.carb + cGet.carb + vGet.carb;
		var cals = pGet.foodcals + fGet.foodcals + cGet.foodcals + vGet.foodcals;

		var tableDiv = $('<div>').attr('class', 'col-md-2');
		var mealData = $('<table>').css({'margin-top':'35px'});
		var tableHead = $('<th>').html('Totals');
		var proteinCell = $('<tr>').html("<b>Protein:</b> " + p + ' cals');
		var fatCell = $('<tr>').html("<b>Fat:</b> " + f + ' cals');
		var carbCell = $('<tr>').html("<b>Carbs:</b> " + c + ' cals');
		var calCell = $('<tr>').html("<b>Calories:</b> " + cals + ' cals');
		mealData.append(tableHead, proteinCell, fatCell, carbCell, calCell);

		tableDiv.append(mealData);
		row.append(tableDiv);
		m.append(row)
	};
}