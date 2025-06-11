export interface IActionValidator {
    actionType: string;
    validator: (action: any) => {
        valid: boolean;
        message?: string;
    };
}
