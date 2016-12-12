// Controller for board
// Contributer: Jessica, Niki

angular.module('boardCtrl', ['boardService'])

// controller applied to board creation page
.controller('boardCreateController', function($location, Board) {
	
	var vm = this;

	vm.create = false;
	vm.join = false;
	vm.either = (vm.create || vm.join);
	vm.homepage = true;

	vm.createBoard = function(){

		vm.create = true;
		vm.join = false;
		vm.either = (vm.create || vm.join);

		Board.create().then(function(data){
			vm.boardCode = data.data.id;
		});
	};

	vm.joinBoard = function(){
		vm.join = true;
		vm.create = false;
		vm.either = (vm.create || vm.join);
	}

	vm.getBoard = function() {
		vm.successfulCode = '';

		Board.get(vm.boardData)
			.error(function(data) {
				vm.successfulCode = 'false';
			})
			.then(function(data) {
				vm.success = data.data.success;
				var boardCode = data.data.board.boardId;
				if(vm.success){
					$location.path('/boards/' + boardCode);
				} else {
					vm.successfulCode = 'false';
				}
			});		
	};

	vm.reset = function(){
		vm.create = false;
		vm.join = false;
		vm.either = (vm.create || vm.join);
	}	

});