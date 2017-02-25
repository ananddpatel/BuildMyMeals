var modifers = {
	"Male": {
		mod: 66,
		weight: 6.23,
		height: 12.7,
		age: 6.8
	},
	"Female":{
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

var lossgainWeeklyCal, eer, weightLoss;

// meal maker vars
var dailyMacroData, numMeals, foods;

$.ajax({
	url: "data/foods.json",
	success: function(data){
		// for some reason github pages doesnt need to parse the data 
		// but on dev server it does

		// for dev server
		foods = JSON.parse(data);
		console.log(foods);

		// for github pages server
		// foods = data;
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
		dayProtein = dailyMacroData.protein.grams;
		dayFat = dailyMacroData.fat.grams;
		dayCarb = dailyMacroData.carb.grams;

		displayMeals(amountOfMeals);
	})
}

function makeMacrosPerMealTable(amountOfMeals, p, f, c) {
	protein = Math.round(p/amountOfMeals);
	fat = Math.round(f/amountOfMeals);
	carb = Math.round(c/amountOfMeals);
	calories = protein*4 + fat*9 + carb*4;

	var tables = $('<table>', {class: "table table-bordered"});
	var head = $('<tr>');
	var info = $('<tr>');

	head.append(
		$('<th>', {text: "Protein g/meal"}),
		$('<th>', {text: "Fats g/meal"}),
		$('<th>', {text: "Carbohydrates g/meal"}),
		$('<th>', {text: "Calories cals/meal"})
	);

	info.append(
		$('<td>', {text: protein+"g"}),
		$('<td>', {text: fat+"g"}),
		$('<td>', {text: carb+"g"}),
		$('<td>', {text: calories+"cals"})
	);

	tables.append(
		$('<tbody>').append(head),
		$('<tbody>').append(info)
	);

	// return $('<div>', {class: "container"}).append(tables);
	return tables;
}

function getRandomFood(foodList) {
	var rng = getRndInt(0, foodList.length-1);
	return foodList[rng];
}

function makeFoodMacroTable(food) {
	var table = $('<table>', {class: "table table-bordered"});
	var head = $('<td>', {align: "center", colspan: "2", text: food+"/100g"});
	var foodObject = foods["foods"][food];
	var protein = $('<tr>').append(
		$('<td>', {text: "Protein"}),
		$('<td>', {text: foodObject.protein + "g"})
	)
	var fat = $('<tr>').append(
		$('<td>', {text: "Fats"}),
		$('<td>', {text: foodObject.fat + "g"})
	)
	var carb = $('<tr>').append(
		$('<td>', {text: "Carbohydrates"}),
		$('<td>', {text: foodObject.carb + "g"})
	)
	var cals = $('<tr>').append(
		$('<td>', {text: "Calories"}),
		$('<td>', {text: foodObject.calories + "cals"})
	)

	table.append(
		$('<thead>').append(head),
		$('<tbody>').append(protein, fat, carb, cals)
	);

	// return $('<div>', {class: "table-responsivess"}).append(table);
	return table;
}

function makeMeal(){
	var row = $('<div>', {class: "row"});
	var categories = ["protein source", "fat source", "carb source", "fruitsandveg"]

	for (var i = 0; i < categories.length; i++) {
		var foodCol = $('<div>', {class: "col-sm-3 col-md-3"});
		var food = getRandomFood(foods[categories[i]]);
		var img = $('<img>', {src: "img/"+food+".jpg"});
		var table = makeFoodMacroTable(food);

		foodCol.append(img, table);
		row.append(foodCol);
	}

	return row;
}

function displayMeals(meals) {
	var main = $('#main');
	heading.text('Meals');
	$('#mealRec').append(makeMacrosPerMealTable(amountOfMeals, dayProtein, dayFat, dayCarb));

	for (var i = 0; i < meals; i++) {
		var mealnum = $('<h3>', {text: "Meal "+(i+1)});
		main.append(mealnum, makeMeal());
	}
}