const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to execute shell commands and log output
function runCommand(command) {
  console.log(`\n> ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.stdout || error.message);
    process.exit(1);
  }
}

// Main deployment function
async function deploy() {
  console.log('🚀 Starting deployment process...');
  
  // Check for uncommitted changes
  const status = runCommand('git status --porcelain');
  
  if (status) {
    console.log('📝 Uncommitted changes detected.');
    
    // Ask for commit message
    rl.question('Enter commit message: ', (commitMessage) => {
      if (!commitMessage) {
        commitMessage = 'Update application with web search functionality';
      }
      
      // Stage all changes
      runCommand('git add .');
      
      // Commit changes
      runCommand(`git commit -m "${commitMessage}"`);
      
      // Push to GitHub
      console.log('🔄 Pushing changes to GitHub...');
      runCommand('git push origin main');
      
      console.log('\n✅ Deployment process completed successfully!');
      console.log('Your changes have been pushed to GitHub.');
      console.log('If Render is configured for automatic deployments, your app will be deployed soon.');
      
      rl.close();
    });
  } else {
    console.log('✅ No changes to commit.');
    rl.close();
  }
}

// Run the deployment
deploy(); 