export interface GeneratedTestLogic {
  steps: string[];
  assertions: string[];
  negativeTests: {
    case: string;
    steps: string[];
    assertions: string[];
  }[];
}

export class AITestLogicService {
  generate(requirementDescription: string): GeneratedTestLogic {
    const desc = requirementDescription.toLowerCase();

    const steps: string[] = [];
    const assertions: string[] = [];
    const negativeTests: { case: string; steps: string[]; assertions: string[] }[] = [];

    // Basic navigation inference
    if (desc.includes('login') || desc.includes('sign in')) {
      steps.push('Navigate to the login page');
      steps.push('Fill the email field with a valid email');
      steps.push('Fill the password field with a valid password');
      steps.push('Click the Login button');
      assertions.push('Expect the dashboard to be visible');

      negativeTests.push({
        case: 'Empty email',
        steps: [
          'Navigate to the login page',
          'Leave the email field empty',
          'Fill the password field with a valid password',
          'Click the Login button'
        ],
        assertions: ['Expect an email required validation message']
      });

      negativeTests.push({
        case: 'Invalid password',
        steps: [
          'Navigate to the login page',
          'Fill the email field with a valid email',
          'Fill the password field with an invalid password',
          'Click the Login button'
        ],
        assertions: ['Expect an invalid credentials error message']
      });
    }

    // Form validation inference
    if (desc.includes('form') || desc.includes('submit')) {
      steps.push('Fill all required fields with valid data');
      steps.push('Click the Submit button');
      assertions.push('Expect a success message to appear');

      negativeTests.push({
        case: 'Missing required fields',
        steps: [
          'Navigate to the form page',
          'Leave required fields empty',
          'Click the Submit button'
        ],
        assertions: ['Expect validation errors to be displayed']
      });
    }

    // API logic inference
    if (desc.includes('api') || desc.includes('endpoint')) {
      steps.push('Send a valid request to the API endpoint');
      assertions.push('Expect the response status to be 200');

      negativeTests.push({
        case: 'Invalid payload',
        steps: ['Send a request with invalid payload'],
        assertions: ['Expect the response status to be 400']
      });
    }

    // Fallback generic logic
    if (steps.length === 0) {
      steps.push('Navigate to the relevant page');
      steps.push('Interact with the required element(s)');
      assertions.push('Expect the expected UI change or result to occur');
    }

    return {
      steps,
      assertions,
      negativeTests
    };
  }
}
