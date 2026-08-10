const BASE_URL = "http://localhost:5000/api";

// ================= REGISTER =================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const fullName = document.getElementById("fullName").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {

            const response = await fetch(`${BASE_URL}/auth/register`,{

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({
                    fullName,
                    email,
                    password
                })

            });

            const data=await response.json();

            if(response.ok){

                Swal.fire({

                    icon:"success",

                    title:"Registration Successful",

                    text:data.message,

                    timer:1800,

                    showConfirmButton:false

                });

                setTimeout(()=>{

                    window.location.href="login.html";

                },1800);

            }

            else{

                Swal.fire({

                    icon:"error",

                    title:"Registration Failed",

                    text:data.message

                });

            }

        }

        catch(error){

            Swal.fire({

                icon:"error",

                title:"Server Error",

                text:error.message

            });

        }

    });

}


// ================= LOGIN =================

const loginForm=document.getElementById("loginForm");

if(loginForm){

loginForm.addEventListener("submit",async(e)=>{

e.preventDefault();

const email=document.getElementById("email").value;

const password=document.getElementById("password").value;

try{

const response=await fetch(`${BASE_URL}/auth/login`,{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

email,

password

})

});

const data=await response.json();

if(response.ok){

localStorage.setItem("token",data.token);

localStorage.setItem("user",JSON.stringify(data.user));

Swal.fire({

icon:"success",

title:"Login Successful",

timer:1200,

showConfirmButton:false

});

setTimeout(()=>{

window.location.href="dashboard.html";

},1200);

}

else{

Swal.fire({

icon:"error",

title:"Login Failed",

text:data.message

});

}

}

catch(error){

Swal.fire({

icon:"error",

title:"Server Error",

text:error.message

});

}

});

}



// ================= ADMIN LOGIN =================

const adminLoginForm=document.getElementById("adminLoginForm");

if(adminLoginForm){

adminLoginForm.addEventListener("submit",async(e)=>{

e.preventDefault();

const email=document.getElementById("email").value;

const password=document.getElementById("password").value;

const response=await fetch(`${BASE_URL}/auth/login`,{

method:"POST",

headers:{

"Content-Type":"application/json"

},

body:JSON.stringify({

email,

password

})

});

const data=await response.json();

if(response.ok){

if(data.user.role!=="admin"){

return Swal.fire({

icon:"error",

title:"Access Denied",

text:"This account is not an administrator."

});

}

localStorage.setItem("token",data.token);

localStorage.setItem("user",JSON.stringify(data.user));

Swal.fire({

icon:"success",

title:"Welcome Admin",

timer:1200,

showConfirmButton:false

});

setTimeout(()=>{

window.location.href="admin-dashboard.html";

},1200);

}

else{

Swal.fire({

icon:"error",

title:"Login Failed",

text:data.message

});

}

});

}