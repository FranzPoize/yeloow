'use strict';

(function( window ) {
	window.RBNode = function(value, data, left, right, parent) {
		this.value = value;
		this.data = data;
		this.color = RBNode.RED;
		this.parent = parent;
		this.left = left;
		this.right = right;

		return this;
	}

	RBNode.RED = 1;
	RBNode.BLACK = 0;

	RBNode.prototype.grdParent = function() {
		if (this.parent)
			return this.parent.parent;
		else
			return undefined;
	};

	RBNode.prototype.uncle = function() {
		var g = this.grdParent();
		if (!g)
			return undefined;
		if (this.parent == g.right)
			return g.left;
		else
			return g.right;
	};

	function insert( node, value, data, parent ) {
		if (!node) {
			var newNode = new RBNode(value,data,undefined,undefined,parent);
			if (parent && value <= parent.value) {
				parent.left = newNode;
			} else if (parent) {
				parent.right = newNode;
			}
			return newNode;
		} else if ( value <= node.value ) {
			return insert(node.left,value,data,node);
		} else {
			return insert(node.right, value, data, node);
		}
	}

	function rebalance( node ) {
		function rotateLeft(node) {
			var oldNode = node,
				child = node.right,
				oldChildLeft = child.left;

			child.parent = oldNode.parent;
			if (!child.parent) {
				RBNode.rootNode = child;
			} else {
				if (oldNode == oldNode.parent.left) {
					child.parent.left = child;
				} else {
					child.parent.right = child;
				}
			}

			oldNode.right = oldChildLeft;
			if (oldChildLeft)
				oldChildLeft.parent = oldNode;

			child.left = oldNode;
			oldNode.parent = child; 
		}

		function rotateRight(node) {
			var oldNode = node,
				child = node.left,
				oldChildRight = child.right;

			child.parent = oldNode.parent;
			if (!child.parent) {
				RBNode.rootNode = child;
			} else {
				if (oldNode == oldNode.parent.left) {
					child.parent.left = child;
				} else {
					child.parent.right = child;
				}
			}

			oldNode.left = oldChildRight;
			if (oldChildRight)
				oldChildRight.parent = oldNode;

			child.right = oldNode;
			oldNode.parent = child; 
		}

		var uncleIsBlackAndLeftChild = function ( node ) {
			var g = node.grdParent();
			node.parent.color = RBNode.BLACK;
			g.color = RBNode.RED;
			if (node == node.parent.left) {
				rotateRight(g);
			} else {
				rotateLeft(g);
			}
		}

		var uncleIsBlackAndRightChild = function ( node ) {
			var g = node.grdParent(),
				oldParent = node.parent;
			if (node == node.parent.right && node.parent == g.left) {
				rotateLeft(node.parent);
				node = oldParent;
			} else if (node == node.parent.left && node.parent == g.right) {
				rotateRight(node.parent);
				node = oldParent;
			}
			uncleIsBlackAndLeftChild( node );
		}

		var parentIsRed = function ( node ) {
			var u = node.uncle();

			if (u && u.color == RBNode.RED) {
				node.parent.color = RBNode.BLACK;
				u.color = RBNode.BLACK;
				var g = node.grdParent();
				g.color = RBNode.RED;
				rootCase(g);
			} else {
				uncleIsBlackAndRightChild(node);
			}
		}

		var parentIsBlack = function ( node ) {
			if (node.parent.color == RBNode.RED) {
				parentIsRed(node);
			}
		}

		var rootCase = function (node) {
			if (!node.parent)
				node.color = RBNode.BLACK;
			else
				parentIsBlack(node);
		}

		rootCase(node);
	}

	window.insertAndRebalance = function(node, value, data, parent) {
		var newNode = insert(node, value, data, parent);
		rebalance(newNode);
		return newNode;
	}

})(window)
