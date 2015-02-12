(function( window ) {
	window.readChar = function ( array ) {
		return array[array.readingIndex++];
	}

	window.readWord = function ( array ) {
		return array[array.readingIndex++] | array[array.readingIndex++] << 8;
	}

	window.readInt = function ( array ) {
		return array[array.readingIndex++] | array[array.readingIndex++] << 8 | array[array.readingIndex++] << 16 | array[array.readingIndex++] << 24;
	}

	window.readLong = function ( arrvar ) {
		return array[array.readingIndex++] | array[array.readingIndex++] << 8 | array[array.readingIndex++] << 16 | array[array.readingIndex++] << 24 |
		array[array.readingIndex++] << 32 | array[array.readingIndex++] << 40 | array[array.readingIndex++] << 48 | array[array.readingIndex++] << 56;
	}
})(window)
