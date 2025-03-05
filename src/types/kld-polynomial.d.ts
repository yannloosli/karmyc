declare module 'kld-polynomial' {
    export class Polynomial {
      constructor(...coefficients: number[]);
      
      getDegree(): number;
      getCoefficients(): number[];
      getRoots(): number[];
      getRealRoots(): number[];
      getImaginaryRoots(): {real: number, imaginary: number}[];
      
      // Ajoutez d'autres méthodes selon vos besoins
      evaluate(x: number): number;
      multiply(that: Polynomial): Polynomial;
      divide(that: Polynomial): {quotient: Polynomial, remainder: Polynomial};
      differentiate(): Polynomial;
      // etc.
    }
  
    // Autres classes/fonctions exportées par la bibliothèque
    export class QuadraticRootFinder {
      static getRoots(a: number, b: number, c: number): number[];
    }
  
    export class CubicRootFinder {
      static getRoots(a: number, b: number, c: number, d: number): number[];
    }
  
    export class QuarticRootFinder {
      static getRoots(a: number, b: number, c: number, d: number, e: number): number[];
    }
  }
  