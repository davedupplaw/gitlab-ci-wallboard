interface Array<T> {
    flatMap<E>(callback: (t: T) => Array<E>): Array<E>;
    max<E>(selector: (t: T) => E): T;
}

Object.defineProperty(Array.prototype, 'flatMap', {
    value: function (f: Function) {
        return this.reduce((ys: any, x: any) => {
            return ys.concat(f.call(this, x));
        }, []);
    },
    enumerable: false,
});

Object.defineProperty(Array.prototype, 'max', {
   value: function( selector: Function) {
       return this.reduce( (a: any, b: any): any =>
           selector(a) > selector(b) ? a : b );
   }
});
