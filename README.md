<h1>DOST VI - Chatbot</h1>
<style>
details{border-left:2px solid #fff5;margin-left:10px;margin-top:30px;padding-left:10px}
summary{position:relative;left:-15.5px;top:-20px;margin-bottom:-25px;}
</style>
<details open>
  <summary><b>Problems and Solutions</b></summary>
  <details open>
    <summary><b>Current solutions to problems</b></summary>
    <table>
        <tr><th>Problem</th><th>Solution</th></tr>
        <tr><td>Individuals face difficulties finding DOST-relevant information scattered across multiple sources</td><td>By developing a chatbot for Facebook Messenger, the most widely used communication platform in the Philippines, we can centralize information access. This approach will reach a broader audience, including those with slower internet connections or limited technological skills, providing a single, comprehensive source of information.</td>
        <tr><td>The information available is not personalized or easily understood without additional explanation</td><td>The chatbot can be trained or integrated with DOST documents and information to address specific queries. It will provide tailored explanations and guide users through processes, reducing frustration and confusion while preventing missed opportunities.</td></tr>
        <tr><td>Not everyone speaks or understands English, particularly those who need help the most</td><td>By utilizing a multilingual language model, the chatbot can interact in various languages, making DOST processes, programs, scholarships, and services accessible to non-English speakers.</td></tr>
    </table>
  </details>
  <details open>
    <summary><b>Future solutions to problems</b></summary>
    <table>
        <tr><th>Problem</th><th>Solution</th></tr>
        <tr><td>Individuals face difficulties finding DOST-relevant information scattered across multiple sources</td><td>By developing a chatbot for Facebook Messenger, the most widely used communication platform in the Philippines, we can centralize information access. This approach will reach a broader audience, including those with slower internet connections or limited technological skills, providing a single, comprehensive source of information.</td>
        <tr><td>The information available is not personalized or easily understood without additional explanation</td><td>The chatbot can be trained or integrated with DOST documents and information to address specific queries. It will provide tailored explanations and guide users through processes, reducing frustration and confusion while preventing missed opportunities.</td></tr>
        <tr><td>Not everyone speaks or understands English, particularly those who need help the most</td><td>By utilizing a multilingual language model, the chatbot can interact in various languages, making DOST processes, programs, scholarships, and services accessible to non-English speakers.</td></tr>
    </table>
  </details>
</details>
<details open>
  <summary><b>Technical Explaination</b></summary>
  <details open>
    <summary><b>Technologies used</b></summary>
    <table>
      <tr><th>Technology</th><th>Purpose</th><th>Reason</th></tr>
      <tr><td>Node JS</td><td>Main platform</td><td>Works best with the next following technologies then with python(slow), C++(hard), etc.</td></tr>
      <tr><td>Electron</td><td>Application engine</td><td>Makes packaging across platforms easier, albeit it bloated. Good for packaging the next following technologies</td></tr>
      <tr><td>Ollama</td><td>Large Language Model Manager</td><td>Allows training/deployment/management of LLM models easier</td></tr>
      <tr><td>Puppeteer</td><td>Automation and emulating APIs</td><td>APIs of services like Facebook, Instagram, etc. are not free so headless automating browsers allows us to use them for free</td></tr>
    </table>
  </details>
  <details open>
    <summary><b>Challenges we faced</b></summary>
    <table>
      <tr><th>Challenge</th><th>Explaination/Solution</th></tr>
      <tr><td>Finding a good base LLM model</td><td>Instead of creating an LLM from scratch which would require huge amount of computative power and huge datasets which we cant have, we started with a base LLM model using <b>Ollama</b> to manage, eventually sticking on the <b>LLama3 7b</b> model. Any more advance LLM are too slow or too resource intensive</td></tr>
      <tr><td>Training our own custom model</td><td>To train or fine-tune the model on the dataset of four provided documents, we applied some LLM techniques like Chunking, Few Shot Learning, and Prompt engineering to enhance the efficiency and accuracy of the information that's retrieved and processed in the NLP. The hardest data set to train on was the RSTL services document because is was the largest among the four</td></tr>
      <tr><td>Graphical Designing</td><td>Since our groups consist primarly of Computer engineering students we lacked the human resources to design a good graphical user interface so we had to spend alot of time planning and trail and error a good looking interface. Resulting into a minimalistic simple interface</td></tr>
    </table>
  </details>
  <details open>
    <summary><b>Processsing stages</b></summary>
    <ol>
      <li>We first downloaded our dataset and convert them from PDF to images, markdowns, texts, etc. mostly locally though softwares like <code>pandoc</code> or <code>convert</code> so that we can later use them to train the model</li>
      <li>We downloaded <b>Ollama</b> and tested serveral pre-existing LLM/NLP to act has our base LLM to train our fine-tuined model like <b>Llama</b>, <b>Mistral</b>, and <b>llava</b></li>
      <li>We trail and error different <b>modelfile</b>s on different LLM models and decided to stick to <b>LLama3 7b</b> for it was the most advance LLM/NLP we can host without it being too slow or dumb. This step of the process happened in parallel with the UI development because it took a long time to fine-tune it to our desired model</b>
      <li>The best platform to make this project was <b>Python</b> for it support in AI frameworks, <b>Javascript</b> for its adaptibility in most systems, and <b>C/C++</b> for its optimizations and efficency. Python is slow, limited interface(tkinter), and lacked packability in different systems. C/C++ is good but would take alot of time thus not suited for our limited time range. Thus we picked Javascript, more specifically Node JS for its diversity in packages (NPM)</li>
      <li>We created an Electron project to allow future packability in different systems especially servers</li>
      <li>We then created the interface in pure HTML, JS, and CSS for the electron to display</li>
      <li>
    </ol>
  </details>
  <details open>
    <summary><b>User interface</b></summary>
  </details>
  <details open>
    <summary><b>Challenges</b></summary>
  </details>
  <details open>
    <summary><b>Current Limitations</b></summary>
  </details>
</details>
