import mistralai
print(dir(mistralai))
try:
    from mistralai.client import MistralClient
    print("Found MistralClient!")
except Exception as e:
    print(e)
try:
    from mistralai import Mistral
    print("Found Mistral!")
except Exception as e:
    print(e)
