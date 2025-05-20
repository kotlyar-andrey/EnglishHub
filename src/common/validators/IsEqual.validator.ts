import {
    registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint,
    ValidatorConstraintInterface
} from 'class-validator';

@ValidatorConstraint({ async: false })
class EqualConstraint implements ValidatorConstraintInterface {
  validate(value: any, validationArguments: ValidationArguments): boolean {
    const [relatedPropertyName] = validationArguments.constraints;
    const secondValue = validationArguments.object[relatedPropertyName];
    return value === secondValue;
  }

  defaultMessage?(validationArguments: ValidationArguments): string {
    const [relatedPropertyName] = validationArguments.constraints;
    return `${validationArguments.property} must match ${relatedPropertyName}`;
  }
}

export function IsEqual(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return (obj: object, propertyName: string) => {
    registerDecorator({
      target: obj.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: EqualConstraint,
    });
  };
}
